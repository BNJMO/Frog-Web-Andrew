import {GameData} from './game-data.model';

export interface Result {
  time: Date;
  draw: string;
  game: GameData;
  result: any;
  videoLink: string;
}
