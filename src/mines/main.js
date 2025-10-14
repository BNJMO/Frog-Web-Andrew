import { createGame } from "./game/game.js";
import { ControlPanel } from "./controlPanel/controlPanel.js";

function resolveMount(target, fallbackSelector) {
  if (target instanceof HTMLElement) {
    return target;
  }
  if (typeof target === "string") {
    const element = document.querySelector(target);
    if (element) {
      return element;
    }
    if (fallbackSelector && target !== fallbackSelector) {
      return resolveMount(fallbackSelector);
    }
    throw new Error(`Mount target '${target}' not found`);
  }
  if (target && typeof target === "object" && "nativeElement" in target) {
    return resolveMount(target.nativeElement, fallbackSelector);
  }
  throw new Error("Invalid mount target provided");
}

export async function initializeMinesGame(config = {}) {
  const {
    gameMount = "#game",
    controlPanelMount = "#control-panel",
    gameOptions = {},
    controlPanelOptions = {},
  } = config;

  const gameNode = resolveMount(gameMount, "#game");
  const controlPanelNode = resolveMount(controlPanelMount, "#control-panel");

  let game;
  let controlPanel;
  let betButtonMode = "cashout";
  let roundActive = false;
  let cashoutAvailable = false;
  let lastKnownGameState = null;
  let selectionDelayHandle = null;
  let selectionPending = false;
  let minesSelectionLocked = false;

  const listeners = [];

  const SERVER_RESPONSE_DELAY_MS = 250;

  const setControlPanelBetMode = (mode) => {
    betButtonMode = mode === "bet" ? "bet" : "cashout";
    controlPanel?.setBetButtonMode?.(betButtonMode);
  };

  const setControlPanelBetState = (isClickable) => {
    controlPanel?.setBetButtonState?.(isClickable ? "clickable" : "non-clickable");
  };

  const setControlPanelRandomState = (isClickable) => {
    controlPanel?.setRandomPickState?.(isClickable ? "clickable" : "non-clickable");
  };

  const setControlPanelMinesState = (isClickable) => {
    controlPanel?.setMinesSelectState?.(isClickable ? "clickable" : "non-clickable");
  };

  const setGameBoardInteractivity = (enabled) => {
    if (!gameNode) {
      return;
    }
    gameNode.classList.toggle("is-round-complete", !enabled);
  };

  const clearSelectionDelay = () => {
    if (selectionDelayHandle) {
      clearTimeout(selectionDelayHandle);
      selectionDelayHandle = null;
    }
    selectionPending = false;
  };

  const beginSelectionDelay = () => {
    clearSelectionDelay();
    selectionPending = true;
    setControlPanelBetState(false);
    setControlPanelRandomState(false);
  };

  const applyRoundInteractiveState = (state) => {
    if (!roundActive) {
      return;
    }

    setControlPanelBetMode("cashout");

    if (selectionPending || state?.waitingForChoice) {
      setControlPanelBetState(false);
      setControlPanelRandomState(false);
      cashoutAvailable = (state?.revealedSafe ?? 0) > 0;
      return;
    }

    const hasRevealedSafe = (state?.revealedSafe ?? 0) > 0;
    cashoutAvailable = hasRevealedSafe;
    setControlPanelBetState(hasRevealedSafe);
    setControlPanelRandomState(true);
  };

  const prepareForNewRoundState = () => {
    roundActive = true;
    cashoutAvailable = false;
    clearSelectionDelay();
    setControlPanelBetMode("cashout");
    setControlPanelBetState(false);
    setControlPanelRandomState(true);
    setGameBoardInteractivity(true);
    minesSelectionLocked = false;
    setControlPanelMinesState(true);
  };

  const finalizeRound = () => {
    roundActive = false;
    cashoutAvailable = false;
    clearSelectionDelay();
    setControlPanelBetMode("bet");
    setControlPanelBetState(true);
    setControlPanelRandomState(false);
    setGameBoardInteractivity(false);
    setControlPanelMinesState(false);
  };

  const handleCashout = () => {
    if (!roundActive || !cashoutAvailable) {
      return;
    }

    showCashoutPopup();
    finalizeRound();
  };

  const handleBet = () => {
    game?.reset?.();
    prepareForNewRoundState();
  };

  const handleBetButtonClick = () => {
    if (betButtonMode === "cashout") {
      handleCashout();
    } else {
      handleBet();
    }
  };

  const handleGameStateChange = (state) => {
    lastKnownGameState = state;
    if (!roundActive) {
      return;
    }

    if (state?.gameOver) {
      finalizeRound();
      return;
    }

    applyRoundInteractiveState(state);
  };

  const handleGameOver = () => {
    finalizeRound();
  };

  const handleGameWin = () => {
    game?.showWinPopup?.(24.75, "0.00000003");
    finalizeRound();
  };

  const handleRandomPickClick = () => {
    if (!roundActive || selectionPending) {
      return;
    }

    game?.selectRandomTile?.();
  };

  const handleCardSelected = () => {
    if (!roundActive) {
      return;
    }

    if (!minesSelectionLocked) {
      minesSelectionLocked = true;
      setControlPanelMinesState(false);
    }

    beginSelectionDelay();

    selectionDelayHandle = setTimeout(() => {
      selectionDelayHandle = null;

      if (!roundActive) {
        selectionPending = false;
        return;
      }

      const revealBomb = Math.random() < 0.15;

      if (revealBomb) {
        game?.SetSelectedCardIsBomb?.();
      } else {
        game?.setSelectedCardIsDiamond?.();
      }

      selectionPending = false;
    }, SERVER_RESPONSE_DELAY_MS);
  };

  const showCashoutPopup = () => {
    const betAmount = controlPanel?.getBetValue?.() ?? 0;
    const state = lastKnownGameState;

    let multiplier = 1;
    if (state && typeof state.totalSafe === "number" && state.totalSafe > 0) {
      const progress = Math.max(
        0,
        Math.min(state.revealedSafe / state.totalSafe, 1)
      );
      multiplier = 1 + progress;
    }

    game?.showWinPopup?.(multiplier, betAmount);
  };

  const opts = {
    size: 600,
    backgroundColor: "#0C0B0F",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Arial",
    grid: 5,
    mines: 5,
    diamondTexturePath: "assets/mines/sprites/Diamond.png",
    bombTexturePath: "assets/mines/sprites/Bomb.png",
    iconSizePercentage: 0.7,
    iconRevealedSizeOpacity: 0.2,
    iconRevealedSizeFactor: 0.7,
    cardsSpawnDuration: 350,
    revealAllIntervalDelay: 40,
    strokeWidth: 1,
    gapBetweenTiles: 0.013,
    hoverEnabled: true,
    hoverEnterDuration: 120,
    hoverExitDuration: 200,
    hoverTiltAxis: "x",
    hoverSkewAmount: 0.02,
    wiggleSelectionEnabled: true,
    wiggleSelectionDuration: 900,
    wiggleSelectionTimes: 15,
    wiggleSelectionIntensity: 0.03,
    wiggleSelectionScale: 0.005,
    flipDelayMin: 150,
    flipDelayMax: 500,
    flipDuration: 300,
    flipEaseFunction: "easeInOutSine",
    explosionShakeEnabled: true,
    explosionShakeDuration: 1000,
    explosionShakeAmplitude: 12,
    explosionShakerotationAmplitude: 0.012,
    explosionShakeBaseFrequency: 8,
    explosionShakeSecondaryFrequency: 13,
    explosionSheetEnabled: true,
    explosionSheetPath: "assets/mines/sprites/Explosion_Spritesheet.png",
    explosionSheetCols: 7,
    explosionSheetRows: 3,
    explosionSheetFps: 24,
    explosionSheetScaleFit: 1.0,
    explosionSheetOpacity: 0.2,
    tileTapDownSoundPath: "assets/mines/sounds/TileTapDown.wav",
    tileFlipSoundPath: "assets/mines/sounds/TileFlip.wav",
    tileHoverSoundPath: "assets/mines/sounds/TileHover.wav",
    diamondRevealedSoundPath: "assets/mines/sounds/DiamondRevealed.wav",
    bombRevealedSoundPath: "assets/mines/sounds/BombRevealed.wav",
    winSoundPath: "assets/mines/sounds/Win.wav",
    gameStartSoundPath: "assets/mines/sounds/GameStart.wav",
    diamondRevealPitchMin: 1.0,
    diamondRevealPitchMax: 1.25,
    winPopupShowDuration: 260,
    winPopupWidth: 260,
    winPopupHeight: 200,
    onCardSelected: () => handleCardSelected(),
    onWin: handleGameWin,
    onGameOver: handleGameOver,
    onChange: handleGameStateChange,
    ...gameOptions,
  };

  const totalTiles = opts.grid * opts.grid;
  const maxMines = Math.max(1, totalTiles - 1);
  const initialMines = Math.max(1, Math.min(opts.mines ?? 1, maxMines));
  opts.mines = initialMines;

  const registerListener = (type, handler) => {
    if (!controlPanel) {
      return;
    }
    controlPanel.addEventListener(type, handler);
    listeners.push({ type, handler });
  };

  try {
    controlPanel = new ControlPanel(controlPanelNode, {
      gameName: "Mines",
      totalTiles,
      maxMines,
      initialMines,
      ...controlPanelOptions,
    });

    registerListener("modechange", (event) => {
      console.debug(`Control panel mode changed to ${event.detail.mode}`);
    });
    registerListener("betvaluechange", (event) => {
      console.debug(`Bet value updated to ${event.detail.value}`);
    });
    registerListener("mineschanged", (event) => {
      const mines = event.detail.value;
      opts.mines = mines;
      prepareForNewRoundState();
      game?.setMines?.(mines);
    });
    registerListener("bet", handleBetButtonClick);
    registerListener("randompick", handleRandomPickClick);
    prepareForNewRoundState();
    controlPanel.setBetAmountDisplay("$0.00");
    controlPanel.setProfitOnWinDisplay("$0.00");
    controlPanel.setProfitValue("0.00000000");
  } catch (err) {
    console.error("Control panel initialization failed:", err);
  }

  try {
    game = await createGame(gameNode, opts);
    const state = game?.getState?.();
    if (state) {
      controlPanel?.setTotalTiles?.(state.grid * state.grid, { emit: false });
      controlPanel?.setMinesValue?.(state.mines, { emit: false });
    }
  } catch (e) {
    console.error("Game initialization failed:", e);
    if (gameNode) {
      gameNode.innerHTML = `
        <div style="color: #f44336; padding: 20px; background: rgba(0,0,0,0.8); border-radius: 8px;">
          <h3>❌ Game Failed to Initialize</h3>
          <p><strong>Error:</strong> ${e.message}</p>
          <p>Check console (F12) for full details.</p>
        </div>
      `;
    }
  }

  return {
    get game() {
      return game;
    },
    get controlPanel() {
      return controlPanel;
    },
    destroy() {
      clearSelectionDelay();
      while (listeners.length) {
        const listener = listeners.pop();
        if (listener && controlPanel) {
          controlPanel.removeEventListener(listener.type, listener.handler);
        }
      }
      controlPanel?.destroy?.();
      if (controlPanelNode) {
        controlPanelNode.innerHTML = "";
      }
      game?.destroy?.();
      if (gameNode) {
        gameNode.classList.remove("is-round-complete");
      }
      game = undefined;
      controlPanel = undefined;
    },
  };
}

export default initializeMinesGame;
