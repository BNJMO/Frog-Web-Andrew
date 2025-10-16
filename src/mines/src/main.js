import { createGame } from "./game/game.js";
import { ControlPanel } from "./controlPanel/controlPanel.js";

const diamondTextureUrl = "assets/mines/sprites/Diamond.png";
const bombTextureUrl = "assets/mines/sprites/Bomb.png";
const explosionSheetUrl = "assets/mines/sprites/Explosion_Spritesheet.png";
const tileTapDownSoundUrl = "assets/mines/sounds/TileTapDown.wav";
const tileFlipSoundUrl = "assets/mines/sounds/TileFlip.wav";
const tileHoverSoundUrl = "assets/mines/sounds/TileHover.wav";
const diamondRevealedSoundUrl = "assets/mines/sounds/DiamondRevealed.wav";
const bombRevealedSoundUrl = "assets/mines/sounds/BombRevealed.wav";
const winSoundUrl = "assets/mines/sounds/Win.wav";
const gameStartSoundUrl = "assets/mines/sounds/GameStart.wav";

let game;
let controlPanel;
let betButtonMode = "cashout";
let roundActive = false;
let cashoutAvailable = false;
let lastKnownGameState = null;
let selectionDelayHandle = null;
let selectionPending = false;
let minesSelectionLocked = false;
let gameMountElement = null;
let controlPanelMountElement = null;
let controlPanelEventHandlers = [];
let opts = null;

const SERVER_RESPONSE_DELAY_MS = 250;

function resolveMount(target) {
  if (!target) {
    return null;
  }
  if (typeof target === "string") {
    return document.querySelector(target);
  }
  return target;
}

function setControlPanelBetMode(mode) {
  betButtonMode = mode === "bet" ? "bet" : "cashout";
  controlPanel?.setBetButtonMode?.(betButtonMode);
}

function setControlPanelBetState(isClickable) {
  controlPanel?.setBetButtonState?.(isClickable ? "clickable" : "non-clickable");
}

function setControlPanelRandomState(isClickable) {
  controlPanel?.setRandomPickState?.(isClickable ? "clickable" : "non-clickable");
}

function setControlPanelMinesState(isClickable) {
  controlPanel?.setMinesSelectState?.(isClickable ? "clickable" : "non-clickable");
}

function setGameBoardInteractivity(enabled) {
  if (!gameMountElement) {
    return;
  }
  gameMountElement.classList.toggle("is-round-complete", !enabled);
}

function clearSelectionDelay() {
  if (selectionDelayHandle) {
    clearTimeout(selectionDelayHandle);
    selectionDelayHandle = null;
  }
  selectionPending = false;
}

function beginSelectionDelay() {
  clearSelectionDelay();
  selectionPending = true;
  setControlPanelBetState(false);
  setControlPanelRandomState(false);
}

function applyRoundInteractiveState(state) {
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
}

function prepareForNewRoundState() {
  roundActive = true;
  cashoutAvailable = false;
  clearSelectionDelay();
  setControlPanelBetMode("cashout");
  setControlPanelBetState(false);
  setControlPanelRandomState(true);
  setGameBoardInteractivity(true);
  minesSelectionLocked = false;
  setControlPanelMinesState(true);
}

function finalizeRound() {
  roundActive = false;
  cashoutAvailable = false;
  clearSelectionDelay();
  setControlPanelBetMode("bet");
  setControlPanelBetState(true);
  setControlPanelRandomState(false);
  setGameBoardInteractivity(false);
  setControlPanelMinesState(false);
}

function handleBetButtonClick() {
  if (betButtonMode === "cashout") {
    handleCashout();
  } else {
    handleBet();
  }
}

function handleCashout() {
  if (!roundActive || !cashoutAvailable) {
    return;
  }

  showCashoutPopup();
  finalizeRound();
}

function handleBet() {
  game?.reset?.();
  prepareForNewRoundState();
}

function handleGameStateChange(state) {
  lastKnownGameState = state;
  if (!roundActive) {
    return;
  }

  if (state?.gameOver) {
    finalizeRound();
    return;
  }

  applyRoundInteractiveState(state);
}

function handleGameOver() {
  finalizeRound();
}

function handleGameWin() {
  game?.showWinPopup?.(24.75, "0.00000003");
  finalizeRound();
}

function handleRandomPickClick() {
  if (!roundActive || selectionPending) {
    return;
  }

  game?.selectRandomTile?.();
}

function handleCardSelected() {
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
}

function showCashoutPopup() {
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
}
function createDefaultOptions() {
  return {
    // Window visuals
    size: 600,
    backgroundColor: "#091B26",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Arial",

    // Game setup
    grid: 5,
    mines: 5,

    // Visuals
    diamondTexturePath: diamondTextureUrl,
    bombTexturePath: bombTextureUrl,
    iconSizePercentage: 0.7,
    iconRevealedSizeOpacity: 0.2,
    iconRevealedSizeFactor: 0.7,
    cardsSpawnDuration: 350,
    revealAllIntervalDelay: 40,
    strokeWidth: 1,
    gapBetweenTiles: 0.013,

    // Animations feel
    hoverEnabled: true,
    hoverEnterDuration: 120,
    hoverExitDuration: 200,
    hoverTiltAxis: "x",
    hoverSkewAmount: 0.02,

    // Card Selected Wiggle
    wiggleSelectionEnabled: true,
    wiggleSelectionDuration: 900,
    wiggleSelectionTimes: 15,
    wiggleSelectionIntensity: 0.03,
    wiggleSelectionScale: 0.005,

    // Card Reveal Flip
    flipDelayMin: 150,
    flipDelayMax: 500,
    flipDuration: 300,
    flipEaseFunction: "easeInOutSine",

    // Bomb Explosion shake
    explosionShakeEnabled: true,
    explosionShakeDuration: 1000,
    explosionShakeAmplitude: 12,
    explosionShakerotationAmplitude: 0.012,
    explosionShakeBaseFrequency: 8,
    explosionShakeSecondaryFrequency: 13,

    // Bomb Explosion spritesheet
    explosionSheetEnabled: true,
    explosionSheetPath: explosionSheetUrl,
    explosionSheetCols: 7,
    explosionSheetRows: 3,
    explosionSheetFps: 24,
    explosionSheetScaleFit: 1.0,
    explosionSheetOpacity: 0.2,

    // Sounds
    tileTapDownSoundPath: tileTapDownSoundUrl,
    tileFlipSoundPath: tileFlipSoundUrl,
    tileHoverSoundPath: tileHoverSoundUrl,
    diamondRevealedSoundPath: diamondRevealedSoundUrl,
    bombRevealedSoundPath: bombRevealedSoundUrl,
    winSoundPath: winSoundUrl,
    gameStartSoundPath: gameStartSoundUrl,
    diamondRevealPitchMin: 1.0,
    diamondRevealPitchMax: 1.25,

    // Win pop-up
    winPopupShowDuration: 260,
    winPopupWidth: 260,
    winPopupHeight: 200,

    // Event callback for when a card is selected
    onCardSelected: () => handleCardSelected(),
    onWin: handleGameWin,
    onGameOver: handleGameOver,
    onChange: handleGameStateChange,
  };
}

function cleanup() {
  clearSelectionDelay();
  if (roundActive) {
    try {
      finalizeRound();
    } catch (err) {
      console.warn("Error while finalizing round during cleanup", err);
    }
  }

  controlPanelEventHandlers.forEach(({ event, handler }) => {
    controlPanel?.removeEventListener?.(event, handler);
  });
  controlPanelEventHandlers = [];

  if (controlPanel?.host) {
    controlPanel.host.innerHTML = "";
  }
  controlPanel = null;

  if (game) {
    try {
      game.destroy?.();
    } catch (err) {
      console.warn("Error while destroying game", err);
    }
    game = null;
  }

  if (gameMountElement) {
    gameMountElement.innerHTML = "";
    gameMountElement.classList.remove("is-round-complete");
  }

  if (controlPanelMountElement) {
    controlPanelMountElement.innerHTML = "";
  }

  betButtonMode = "cashout";
  roundActive = false;
  cashoutAvailable = false;
  lastKnownGameState = null;
  selectionPending = false;
  minesSelectionLocked = false;
  gameMountElement = null;
  controlPanelMountElement = null;
  opts = null;
}

export async function initializeMinesGame({
  gameMount = "#game",
  controlPanelMount = "#control-panel",
  options = {},
} = {}) {
  cleanup();

  gameMountElement = resolveMount(gameMount);
  if (!gameMountElement) {
    throw new Error("initializeMinesGame: game mount not found");
  }

  controlPanelMountElement = resolveMount(controlPanelMount);
  if (!controlPanelMountElement) {
    throw new Error("initializeMinesGame: control panel mount not found");
  }

  controlPanelMountElement.innerHTML = "";
  gameMountElement.innerHTML = '<div class="loading">Loading Game</div>';

  betButtonMode = "cashout";
  roundActive = false;
  cashoutAvailable = false;
  lastKnownGameState = null;
  selectionPending = false;
  minesSelectionLocked = false;

  opts = {
    ...createDefaultOptions(),
    ...(options ?? {}),
  };

  const totalTiles = opts.grid * opts.grid;
  const maxMines = Math.max(1, totalTiles - 1);
  const initialMines = Math.max(1, Math.min(opts.mines ?? 1, maxMines));
  opts.mines = initialMines;

  // Initialize Control Panel
  try {
    controlPanel = new ControlPanel(controlPanelMountElement, {
      gameName: "Mines",
      totalTiles,
      maxMines,
      initialMines,
    });

    const modeChangeHandler = (event) => {
      console.debug(`Control panel mode changed to ${event.detail.mode}`);
    };
    controlPanel.addEventListener("modechange", modeChangeHandler);
    controlPanelEventHandlers.push({ event: "modechange", handler: modeChangeHandler });

    const betValueChangeHandler = (event) => {
      console.debug(`Bet value updated to ${event.detail.value}`);
    };
    controlPanel.addEventListener("betvaluechange", betValueChangeHandler);
    controlPanelEventHandlers.push({ event: "betvaluechange", handler: betValueChangeHandler });

    const minesChangedHandler = (event) => {
      const mines = event.detail.value;
      opts.mines = mines;
      prepareForNewRoundState();
      game?.setMines?.(mines);
    };
    controlPanel.addEventListener("mineschanged", minesChangedHandler);
    controlPanelEventHandlers.push({ event: "mineschanged", handler: minesChangedHandler });

    controlPanel.addEventListener("bet", handleBetButtonClick);
    controlPanelEventHandlers.push({ event: "bet", handler: handleBetButtonClick });

    controlPanel.addEventListener("randompick", handleRandomPickClick);
    controlPanelEventHandlers.push({ event: "randompick", handler: handleRandomPickClick });

    prepareForNewRoundState();
    controlPanel.setBetAmountDisplay("$0.00");
    controlPanel.setProfitOnWinDisplay("$0.00");
    controlPanel.setProfitValue("0.00000000");
  } catch (err) {
    console.error("Control panel initialization failed:", err);
  }

  // Initialize Game
  try {
    game = await createGame(gameMountElement, opts);
    const state = game?.getState?.();
    if (state) {
      controlPanel?.setTotalTiles?.(state.grid * state.grid, { emit: false });
      controlPanel?.setMinesValue?.(state.mines, { emit: false });
    }
  } catch (e) {
    console.error("Game initialization failed:", e);
    if (gameMountElement) {
      gameMountElement.innerHTML = `
        <div style="color: #f44336; padding: 20px; background: rgba(0,0,0,0.8); border-radius: 8px;">
          <h3>❌ Game Failed to Initialize</h3>
          <p><strong>Error:</strong> ${e.message}</p>
          <p>Check console (F12) for full details.</p>
        </div>
      `;
    }
  }

  return {
    game,
    controlPanel,
    destroy: cleanup,
    options: opts,
  };
}

export function destroyMinesGame() {
  cleanup();
}

