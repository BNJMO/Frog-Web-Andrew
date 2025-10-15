export type MinesMode = "manual" | "auto";

export interface MinesControlPanelAssets {
  coinIcon?: string;
  betIcon?: string;
  infinityIcon?: string;
  percentageIcon?: string;
}

export interface MinesAssetMap {
  baseUrl?: string;
  diamondTexture?: string;
  bombTexture?: string;
  explosionSheet?: string;
  tileTapDownSound?: string;
  tileFlipSound?: string;
  tileHoverSound?: string;
  diamondRevealedSound?: string;
  bombRevealedSound?: string;
  winSound?: string;
  gameStartSound?: string;
  controlPanel?: MinesControlPanelAssets;
  ui?: MinesControlPanelAssets;
  game?: Record<string, string>;
  textures?: Record<string, string>;
  sounds?: Record<string, string>;
}

export interface MinesLocalizationStrings {
  manualMode: string;
  autoMode: string;
  betAmountLabel: string;
  profitOnWinLabel: string;
  profitLabel: string;
  minesLabel: string;
  gemsLabel: string;
  betButtonLabel: string;
  cashOutButtonLabel: string;
  randomPickLabel: string;
  randomPickAria: string;
  halveBetAria: string;
  doubleBetAria: string;
  increaseBetAria: string;
  decreaseBetAria: string;
  numberOfBetsLabel: string;
  advancedLabel: string;
  onWinLabel: string;
  onLossLabel: string;
  stopOnProfitLabel: string;
  stopOnLossLabel: string;
  startAutobetLabel: string;
  resetStrategyLabel: string;
  increaseStrategyLabel: string;
  betInputAria: string;
  autoModeAria: string;
  manualModeAria: string;
  gameName: string;
  loadingMessage: string;
}

export interface MinesInitialBet {
  value?: string;
  display?: string;
  profitDisplay?: string;
  profitValue?: string;
}

export interface MinesGameState {
  grid: number;
  mines: number;
  revealedSafe: number;
  totalSafe: number;
  gameOver: boolean;
  waitingForChoice: boolean;
  selectedTile: { row: number; col: number } | null;
}

export type MinesAction =
  | { type: "ready" }
  | { type: "state-change"; state: MinesGameState }
  | {
      type: "request-start-round";
      betValue: number;
      betValueFormatted: string | number;
      mines: number;
      mode: MinesMode;
    }
  | {
      type: "request-cash-out";
      betValue: number;
      betValueFormatted: string | number;
    }
  | { type: "request-random-pick" }
  | { type: "select-cell"; row: number; col: number }
  | { type: "mines-change"; value: number; totalTiles?: number; gems?: number }
  | { type: "bet-change"; value: string; numericValue: number }
  | { type: "mode-change"; mode: MinesMode }
  | { type: "round-ended"; reason: "win" | "loss" };

export interface MinesStartRoundOptions {
  mines?: number;
  betValue?: string | number;
  betAmountDisplay?: string;
  profitOnWinDisplay?: string;
  profitValue?: string | number;
  state?: Partial<MinesGameState>;
}

export interface MinesRevealOptions {
  result: "safe" | "bomb";
  profitOnWinDisplay?: string;
  profitValue?: string | number;
  multiplier?: number;
  payoutDisplay?: string;
  state?: Partial<MinesGameState>;
}

export interface MinesBalanceUpdate {
  betAmountDisplay?: string;
  profitOnWinDisplay?: string;
  profitValue?: string | number;
  betValue?: string | number;
}

export interface MinesEndRoundOptions {
  status?: "win" | "loss" | "cashout";
  multiplier?: number;
  payoutDisplay?: string;
  state?: Partial<MinesGameState>;
  resetMines?: boolean;
}

export interface MinesApi {
  startRound(round?: MinesStartRoundOptions): void;
  revealTile(reveal?: MinesRevealOptions): void;
  updateBalance(update?: MinesBalanceUpdate): void;
  endRound(result?: MinesEndRoundOptions): void;
  destroy(): void;
}

export interface MinesApiOptions {
  container: HTMLElement | string;
  assetBaseUrl?: string;
  assets?: MinesAssetMap;
  strings?: Partial<MinesLocalizationStrings>;
  initialBet?: MinesInitialBet;
  gridSize?: number;
  grid?: number;
  initialMines?: number;
  mines?: number;
  initialMode?: MinesMode;
  backgroundColor?: string | number;
  gameOptions?: Record<string, unknown>;
  sounds?: Record<string, string>;
  gameElementId?: string;
  onAction?: (action: MinesAction) => void;
  onReady?: () => void;
}

export declare function createMinesGame(options: MinesApiOptions): MinesApi;
