import {Injectable} from '@angular/core';

@Injectable()
export class GameSettings {
  public volume: number;
  public gameVolume: number;
  public dealerVolume: number;
  public videoAdjust: number;
  public videoQuality: number;
  public sessionTime: number;
  public autoZoom: number;
  public hideOtherChat: number;
  public showBetStat: number;
  public darkMode: number;

  public constructor() {
    this.volume = 100;
    this.gameVolume = 100;
    this.dealerVolume = 100;
    this.videoAdjust = 1;
    this.videoQuality = 0;
    this.sessionTime = 0;
    this.autoZoom = 1;
    this.hideOtherChat = 0;
    this.showBetStat = 1;
    this.darkMode = 0;
  }
}
