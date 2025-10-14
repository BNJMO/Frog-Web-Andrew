import {BetState} from '../bet-state.enum';

export interface Bet {
  id: string;
  betInfo: any;
  timestamp: number;
  amount: number;
  roundBetId: number;
  uuid: string;
  state?: BetState
}
