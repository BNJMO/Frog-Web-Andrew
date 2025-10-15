import "./style.css";

import { createGame } from "./game/game.js";
import {
  ControlPanel,
  DEFAULT_CONTROL_PANEL_STRINGS,
} from "./controlPanel/controlPanel.js";

function resolveContainer(target) {
  if (!target) {
    throw new Error("createMinesGame: container option is required");
  }
  if (target instanceof HTMLElement) {
    return target;
  }
  const element = document.querySelector(target);
  if (!element) {
    throw new Error("createMinesGame: container element not found");
  }
  return element;
}

const DEFAULT_STRINGS = {
  ...DEFAULT_CONTROL_PANEL_STRINGS,
  gameName: "Mines",
  loadingMessage: "Loading Game",
};

const DEFAULT_INITIAL_BET = {
  value: "0.00000000",
  display: "$0.00",
  profitDisplay: "$0.00",
  profitValue: "0.00000000",
};

function pickControlPanelStrings(strings) {
  const result = {};
  for (const key of Object.keys(DEFAULT_CONTROL_PANEL_STRINGS)) {
    if (strings[key] !== undefined) {
      result[key] = strings[key];
    }
  }
  return result;
}

function clampMines(value, totalTiles) {
  const maxMines = Math.max(1, totalTiles - 1);
  const numeric = Math.floor(Number(value));
  if (!Number.isFinite(numeric)) {
    return Math.max(1, Math.min(5, maxMines));
  }
  return Math.max(1, Math.min(numeric, maxMines));
}

function callAction(handler, action) {
  try {
    handler?.(action);
  } catch (err) {
    console.error("createMinesGame onAction handler threw", err);
  }
}

export function createMinesGame(options = {}) {
  const host = resolveContainer(options.container);
  const mergedStrings = {
    ...DEFAULT_STRINGS,
    ...(options.strings ?? {}),
  };
  const initialBet = {
    ...DEFAULT_INITIAL_BET,
    ...(options.initialBet ?? {}),
  };
  const onAction = typeof options.onAction === "function" ? options.onAction : () => {};
  const onReady = typeof options.onReady === "function" ? options.onReady : () => {};
  const assetBaseUrl =
    typeof options.assetBaseUrl === "string"
      ? options.assetBaseUrl
      : typeof options.assets?.baseUrl === "string"
      ? options.assets.baseUrl
      : undefined;

  const gridSize = Math.max(2, Math.floor(options.gridSize ?? options.grid ?? 5));
  const totalTiles = gridSize * gridSize;
  let currentMines = clampMines(options.initialMines ?? options.mines ?? 5, totalTiles);

  host.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "app-container";

  const gameContainer = document.createElement("div");
  gameContainer.className = "game-container";

  const gameMount = document.createElement("div");
  const gameElementId = options.gameElementId ?? "game";
  gameMount.id = gameElementId;
  gameMount.className = "game";
  const loadingMessage = document.createElement("div");
  loadingMessage.className = "loading";
  loadingMessage.textContent = mergedStrings.loadingMessage;
  gameMount.appendChild(loadingMessage);
  gameContainer.appendChild(gameMount);

  const controlPanelMount = document.createElement("div");
  controlPanelMount.className = "control-panel-mount";

  wrapper.appendChild(gameContainer);
  wrapper.appendChild(controlPanelMount);
  host.appendChild(wrapper);

  let controlPanel = new ControlPanel(controlPanelMount, {
    assetBaseUrl,
    assets:
      options.assets?.controlPanel ??
      options.assets?.ui ??
      (options.assets && typeof options.assets === "object" ? options.assets : {}),
    strings: pickControlPanelStrings(mergedStrings),
    gameName: mergedStrings.gameName,
    initialMode: options.initialMode,
    initialBetValue: initialBet.value,
    initialBetAmountDisplay: initialBet.display,
    initialProfitOnWinDisplay: initialBet.profitDisplay,
    initialProfitValue: initialBet.profitValue,
    initialMines: currentMines,
    maxMines: totalTiles - 1,
    totalTiles,
  });

  controlPanel.setBetAmountDisplay(initialBet.display);
  controlPanel.setProfitOnWinDisplay(initialBet.profitDisplay);
  controlPanel.setProfitValue(initialBet.profitValue);

  const cleanupTasks = [];
  const registerCleanup = (fn) => cleanupTasks.push(fn);

  let roundActive = false;
  let betButtonMode = "bet";
  let cashoutAvailable = false;
  let minesSelectionLocked = false;
  let lastKnownGameState = null;
  let destroyed = false;

  function setBetButtonMode(mode) {
    betButtonMode = mode === "cashout" ? "cashout" : "bet";
    controlPanel?.setBetButtonMode?.(betButtonMode);
  }

  function setBetButtonState(enabled) {
    controlPanel?.setBetButtonState?.(enabled ? "clickable" : "non-clickable");
  }

  function setRandomPickState(enabled) {
    controlPanel?.setRandomPickState?.(enabled ? "clickable" : "non-clickable");
  }

  function setMinesSelectState(enabled) {
    controlPanel?.setMinesSelectState?.(enabled ? "clickable" : "non-clickable");
  }

  function setGameInteractivity(enabled) {
    gameMount.classList.toggle("is-round-complete", !enabled);
  }

  function enterIdleState() {
    roundActive = false;
    cashoutAvailable = false;
    minesSelectionLocked = false;
    setBetButtonMode("bet");
    setBetButtonState(true);
    setRandomPickState(false);
    setMinesSelectState(true);
    setGameInteractivity(false);
  }

  function enterRoundState() {
    roundActive = true;
    cashoutAvailable = false;
    minesSelectionLocked = false;
    setBetButtonMode("cashout");
    setBetButtonState(false);
    setRandomPickState(true);
    setMinesSelectState(true);
    setGameInteractivity(true);
  }

  function applyRoundInteractiveState(state) {
    if (!roundActive) {
      return;
    }

    setBetButtonMode("cashout");
    const waiting = Boolean(state?.waitingForChoice);
    if (waiting) {
      setBetButtonState(false);
      setRandomPickState(false);
      cashoutAvailable = (state?.revealedSafe ?? 0) > 0;
      return;
    }

    const revealedSafe = state?.revealedSafe ?? 0;
    cashoutAvailable = revealedSafe > 0;
    setBetButtonState(cashoutAvailable);
    setRandomPickState(true);
  }

  function handleCardSelected(payload) {
    if (!roundActive || !payload) {
      return;
    }
    if (!minesSelectionLocked) {
      minesSelectionLocked = true;
      setMinesSelectState(false);
    }
    setBetButtonState(false);
    setRandomPickState(false);
    callAction(onAction, {
      type: "select-cell",
      row: payload.row,
      col: payload.col,
    });
  }

  function handleGameStateChange(state) {
    lastKnownGameState = state;
    if (roundActive) {
      applyRoundInteractiveState(state);
    }
    callAction(onAction, { type: "state-change", state });
  }

  function handleGameOver() {
    callAction(onAction, { type: "round-ended", reason: "loss" });
  }

  function handleGameWin() {
    callAction(onAction, { type: "round-ended", reason: "win" });
  }

  const gameOptions = {
    ...(options.gameOptions ?? {}),
    grid: gridSize,
    mines: currentMines,
    assetBaseUrl,
    assets:
      options.assets?.game ??
      options.assets?.textures ??
      (options.assets && typeof options.assets === "object" ? options.assets : {}),
    sounds: options.assets?.sounds ?? options.sounds,
    onCardSelected: handleCardSelected,
    onWin: handleGameWin,
    onGameOver: handleGameOver,
    onChange: handleGameStateChange,
    backgroundColor: options.backgroundColor,
  };

  const gamePromise = createGame(gameMount, gameOptions)
    .then((instance) => {
      if (destroyed) {
        instance?.destroy?.();
        return null;
      }
      const state = instance?.getState?.();
      if (state) {
        lastKnownGameState = state;
        controlPanel?.setTotalTiles?.(state.grid * state.grid, { emit: false });
        controlPanel?.setMinesValue?.(state.mines, { emit: false });
        applyRoundInteractiveState(state);
      }
      callAction(onAction, { type: "ready" });
      onReady?.();
      return instance;
    })
    .catch((err) => {
      console.error("Failed to initialise Mines game", err);
      if (!destroyed) {
        gameMount.innerHTML = "";
        const errorBanner = document.createElement("div");
        errorBanner.style.color = "#f44336";
        errorBanner.style.padding = "20px";
        errorBanner.style.background = "rgba(0,0,0,0.8)";
        errorBanner.style.borderRadius = "8px";
        errorBanner.innerHTML = "<strong>Game failed to initialise.</strong>";
        gameMount.appendChild(errorBanner);
      }
      return null;
    });

  function withGame(cb) {
    return gamePromise.then((instance) => {
      if (!instance || destroyed) {
        return undefined;
      }
      return cb(instance);
    });
  }

  function requestBetOrCashout() {
    const betValue = controlPanel?.getBetValue?.() ?? 0;
    const betValueFormatted = controlPanel?.formatBetValue?.(betValue) ?? String(betValue);
    if (betButtonMode === "cashout") {
      if (!roundActive || !cashoutAvailable) {
        return;
      }
      callAction(onAction, {
        type: "request-cash-out",
        betValue: betValue,
        betValueFormatted,
      });
      setBetButtonState(false);
      return;
    }

    callAction(onAction, {
      type: "request-start-round",
      betValue,
      betValueFormatted,
      mines: controlPanel?.getMinesValue?.() ?? currentMines,
      mode: controlPanel?.getMode?.() ?? "manual",
    });
    setBetButtonState(false);
  }

  const onBet = () => requestBetOrCashout();
  controlPanel.addEventListener("bet", onBet);
  registerCleanup(() => controlPanel?.removeEventListener("bet", onBet));

  const onRandomPick = () => {
    if (!roundActive) {
      return;
    }
    setRandomPickState(false);
    callAction(onAction, { type: "request-random-pick" });
  };
  controlPanel.addEventListener("randompick", onRandomPick);
  registerCleanup(() => controlPanel?.removeEventListener("randompick", onRandomPick));

  const onMinesChanged = (event) => {
    const value = event.detail?.value ?? currentMines;
    currentMines = clampMines(value, totalTiles);
    callAction(onAction, {
      type: "mines-change",
      value: currentMines,
      totalTiles: event.detail?.totalTiles ?? totalTiles,
      gems: event.detail?.gems ?? controlPanel?.getGemsValue?.(),
    });
    if (!roundActive) {
      setMinesSelectState(true);
    } else if (!minesSelectionLocked) {
      setMinesSelectState(true);
    }
  };
  controlPanel.addEventListener("mineschanged", onMinesChanged);
  registerCleanup(() => controlPanel?.removeEventListener("mineschanged", onMinesChanged));

  const onBetValueChange = (event) => {
    callAction(onAction, {
      type: "bet-change",
      value: event.detail?.value,
      numericValue: event.detail?.numericValue,
    });
  };
  controlPanel.addEventListener("betvaluechange", onBetValueChange);
  registerCleanup(() => controlPanel?.removeEventListener("betvaluechange", onBetValueChange));

  const onModeChange = (event) => {
    callAction(onAction, { type: "mode-change", mode: event.detail?.mode });
  };
  controlPanel.addEventListener("modechange", onModeChange);
  registerCleanup(() => controlPanel?.removeEventListener("modechange", onModeChange));

  enterIdleState();

  const api = {
    startRound(round = {}) {
      if (destroyed) {
        return;
      }
      if (typeof round.mines === "number") {
        currentMines = clampMines(round.mines, totalTiles);
        controlPanel?.setMinesValue?.(currentMines, { emit: false });
      }
      if (round.betAmountDisplay !== undefined) {
        controlPanel?.setBetAmountDisplay?.(round.betAmountDisplay);
      }
      if (round.profitOnWinDisplay !== undefined) {
        controlPanel?.setProfitOnWinDisplay?.(round.profitOnWinDisplay);
      }
      if (round.profitValue !== undefined) {
        controlPanel?.setProfitValue?.(round.profitValue);
      }
      if (round.betValue !== undefined) {
        controlPanel?.setBetInputValue?.(round.betValue, { emit: false });
      }
      enterRoundState();
      withGame((instance) => {
        if (typeof round.mines === "number") {
          instance.setMines?.(currentMines);
        } else {
          instance.reset?.();
        }
      });
      if (round.state) {
        lastKnownGameState = { ...(lastKnownGameState ?? {}), ...round.state };
        applyRoundInteractiveState(lastKnownGameState);
      }
    },
    revealTile(reveal = {}) {
      if (destroyed) {
        return;
      }
      if (reveal.state) {
        lastKnownGameState = { ...(lastKnownGameState ?? {}), ...reveal.state };
        applyRoundInteractiveState(lastKnownGameState);
      }
      withGame((instance) => {
        if (reveal.result === "bomb") {
          instance.SetSelectedCardIsBomb?.();
        } else {
          instance.setSelectedCardIsDiamond?.();
        }
      });
      if (reveal.profitOnWinDisplay !== undefined) {
        controlPanel?.setProfitOnWinDisplay?.(reveal.profitOnWinDisplay);
      }
      if (reveal.profitValue !== undefined) {
        controlPanel?.setProfitValue?.(reveal.profitValue);
      }
      if (reveal.multiplier !== undefined && reveal.payoutDisplay !== undefined) {
        withGame((instance) => {
          instance.showWinPopup?.(reveal.multiplier, reveal.payoutDisplay);
        });
      }
    },
    updateBalance(update = {}) {
      if (destroyed) {
        return;
      }
      if (update.betAmountDisplay !== undefined) {
        controlPanel?.setBetAmountDisplay?.(update.betAmountDisplay);
      }
      if (update.profitOnWinDisplay !== undefined) {
        controlPanel?.setProfitOnWinDisplay?.(update.profitOnWinDisplay);
      }
      if (update.profitValue !== undefined) {
        controlPanel?.setProfitValue?.(update.profitValue);
      }
      if (update.betValue !== undefined) {
        controlPanel?.setBetInputValue?.(update.betValue, { emit: false });
      }
    },
    endRound(result = {}) {
      if (destroyed) {
        return;
      }
      if (result.state) {
        lastKnownGameState = { ...(lastKnownGameState ?? {}), ...result.state };
      }
      if (result.status === "cashout" || result.status === "win") {
        if (result.multiplier !== undefined && result.payoutDisplay !== undefined) {
          withGame((instance) => {
            instance.showWinPopup?.(result.multiplier, result.payoutDisplay);
          });
        }
      }
      enterIdleState();
      if (result.resetMines === true) {
        controlPanel?.setMinesSelectState?.(true);
      }
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      cleanupTasks.splice(0).forEach((fn) => {
        try {
          fn();
        } catch {}
      });
      controlPanel?.destroy?.();
      controlPanel = null;
      gamePromise.then((instance) => instance?.destroy?.());
      host.innerHTML = "";
    },
  };

  return api;
}
