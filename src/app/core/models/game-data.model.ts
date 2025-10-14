import {GameState} from '../game-state.enum';
import {Bet} from './bet.model';
import {StreamType} from '../stream-type.enum';
export interface GameData {
  title: string;
  type: string;
  instanceId: string;
  settings: any;
   drawId: string;
  streamUrl: string;
  dealerName: string;
  loaded: boolean;
  roundLength: number;
  result: any;
  endDate: Date;
  state: GameState;
  history: Array<any>;
  bets: Array<Bet>;
  userBets: Array<Bet>;
  prevRoundBets: Array<Bet>;
  statistics?: any;
  limits: any;
  config?: any;
  streamConfig: object;
  streamType: StreamType;
  gameFeatures: any;
  disabled?: boolean;
  disableTime?: number;
}
