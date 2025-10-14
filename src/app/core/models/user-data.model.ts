import {Injectable} from '@angular/core';
import {GameData} from './game-data.model';
@Injectable()
export class UserData {
  public id: string;
  public currencyName: string;
  public currencySign: string;
  public localeId: string;
  public sessionId: string;
  public currencyMultiplier: number;
  public balance: number;
  public nick: string;
  public avatar: string;
  public constructor() {
    this.id = '';
    this.balance = 0;
    this.avatar = '';
    this.currencySign = '';
    this.currencyName = '';
    this.currencyMultiplier = 1;
  }
}
