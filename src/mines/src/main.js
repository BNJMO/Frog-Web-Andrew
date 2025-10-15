import { createMinesGame } from "./index.js";

const demoHost = document.querySelector("#demo-root");

if (!demoHost) {
  throw new Error("Demo root element '#demo-root' not found");
}

const assetBaseUrl = new URL("../assets/", import.meta.url).href;

let lastState = null;
let revealedCells = new Set();
let safeReveals = 0;
let currentBet = 0;

const minesGame = createMinesGame({
  container: demoHost,
  assetBaseUrl,
  initialMines: 5,
  strings: {
    gameName: "Mines Demo",
  },
  initialBet: {
    value: "0.00000010",
    display: "$0.00",
    profitDisplay: "$0.00",
    profitValue: "0.00000000",
  },
  onAction: handleAction,
});

function handleAction(action) {
  switch (action.type) {
    case "state-change":
      lastState = action.state;
      break;
    case "ready":
      console.info("Mines demo ready");
      break;
    case "request-start-round":
      startDemoRound(action);
      break;
    case "select-cell":
      handleSelection(action);
      break;
    case "request-random-pick":
      handleRandomPick();
      break;
    case "request-cash-out":
      handleCashOut();
      break;
    default:
      console.debug("Unhandled demo action", action);
  }
}

function startDemoRound(action) {
  const mines = action.mines ?? (lastState?.mines ?? 5);
  currentBet = Number(action.betValue ?? action.betValueFormatted ?? 0);
  revealedCells = new Set();
  safeReveals = 0;

  const betDisplay = formatCurrency(currentBet * 1000);
  minesGame.startRound({
    mines,
    betValue: action.betValueFormatted ?? action.betValue ?? "0.00000000",
    betAmountDisplay: betDisplay,
    profitOnWinDisplay: "$0.00",
    profitValue: "0.00000000",
  });
}

function handleSelection(selection) {
  const key = `${selection.row}:${selection.col}`;
  if (revealedCells.has(key)) {
    return;
  }

  setTimeout(() => {
    const bombChance = 0.2;
    const isBomb = Math.random() < bombChance;
    if (isBomb) {
      minesGame.revealTile({ result: "bomb" });
      minesGame.endRound({ status: "loss" });
      revealedCells.clear();
      safeReveals = 0;
      return;
    }

    revealedCells.add(key);
    safeReveals += 1;

    const totalSafe = lastState?.totalSafe ?? 20;
    const multiplier = 1 + safeReveals * 0.2;
    const profitValue = (safeReveals * 0.00000005).toFixed(8);
    const profitDisplay = formatCurrency(safeReveals * 2.5);

    minesGame.revealTile({
      result: "safe",
      profitOnWinDisplay: profitDisplay,
      profitValue,
    });

    if (safeReveals >= totalSafe) {
      minesGame.endRound({
        status: "win",
        multiplier,
        payoutDisplay: profitValue,
      });
      revealedCells.clear();
      safeReveals = 0;
    }
  }, 350);
}

function handleRandomPick() {
  const candidates = collectAvailableCells();
  if (candidates.length === 0) {
    return;
  }
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  handleSelection(choice);
}

function handleCashOut() {
  const multiplier = 1 + safeReveals * 0.2;
  const profitValue = (safeReveals * 0.00000005).toFixed(8);
  minesGame.endRound({
    status: "cashout",
    multiplier,
    payoutDisplay: profitValue,
  });
  revealedCells.clear();
  safeReveals = 0;
}

function collectAvailableCells() {
  const size = lastState?.grid ?? 5;
  const cells = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const key = `${row}:${col}`;
      if (!revealedCells.has(key)) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

function formatCurrency(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "$0.00";
  }
  return `$${numeric.toFixed(2)}`;
}

window.minesDemo = {
  minesGame,
};
