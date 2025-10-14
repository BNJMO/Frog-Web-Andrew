import {BetType} from '../core/bet-type.enum';

export class Utils {
  numbersMap = [35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12];
  blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
  tableBets = [];

  constructor() {
    return this;
  }

  isRouletteBlack(n) {
    return this.blackNumbers.indexOf(parseInt(n)) !== -1;
  }
  isMobile(){
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  getArray(size) {
    return Array.from(Array(size).keys());
  }

  degToRad(degrees) {
    const pi = Math.PI;
    return degrees * (pi / 180);
  }

  loc(translate, key, params) {
    let val = '';
    translate.get(key, params).subscribe(text => val = text);
    return val;
  }

  inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }
}
