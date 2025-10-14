import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {interval, ReplaySubject} from 'rxjs';
import {ApiService} from './api.service';
import {UserData} from '../models';
import {map} from 'rxjs/operators';
import {GameData} from '../models';
import {GameState} from '../game-state.enum';
import {CookieService} from 'ngx-cookie-service';
import {Router} from '@angular/router';
import {MessageType} from '../msg-type.enum';
import {formatDate} from '@angular/common';
import {StreamType} from '../stream-type.enum';
import moment from "moment";
import { GameSettings } from '../game-settings.model';

@Injectable()
export class GameService {

  constructor(private apiService: ApiService,
              private http: HttpClient,
              private cookieService: CookieService,
              public router: Router,
              public userData: UserData) {
    this.gameData = {} as GameData;
    this.gameData.settings = new GameSettings();
    this.gameData.bets = [];
    this.gameData.prevRoundBets=[];
    this.gameData.userBets = [];
    this.gameData.history = [];
    this.gameData.gameFeatures = {};
    Object.keys(this.gameData.settings).forEach((x: string, index: number) => {
      this.gameData.settings[x] = this.cookieService.check(x) ? parseInt(this.cookieService.get(x)) : this.gameData.settings[x];
    });
    this.gameData.settings['volume'] = 0;
  }

  fullscreenMode = false;
  keyboardActive = false;
  instanceId: string;
  currentLang: string;
  lobbyUrl: string;
  token = '';
  sessionExpired = false;
  messageId: number;
  gameData: GameData;
  languages = [
    {id: 'en', name: 'English'},
    {id: 'ru', name: 'Русский'},
    {id: 'ka', name: 'ქართული'},
    {id: 'uk', name: 'Українська'}
  ];
  historyBets = [];
  results = [];
  public messageEvent = new EventEmitter();
  public errorEvent = new EventEmitter();
  public userDataChangeEvent = new EventEmitter();
  private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();

  sendMessageToParent(msg) {
    if (window.parent !== window) {
      window.parent.postMessage(msg, '*');
      return true;
    } else {
      return false;
    }
  }
  getSessionId(token) {
    return this.apiService.get(`get_session_id?sessionId=${token}`)
      .pipe(map(
        data => {
          return data;
        }
      ));
  }
  setAuth(token: string) {
    this.cookieService.set('token', token);
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  getGameInfo(instanceId) {
    return this.http.get(`${this.apiService.base_server_url}/get/${instanceId}`)
      .pipe(map(
        data => {
          const resp = data['ResponseData'];
          if (data['IsSuccess']) {
            this.gameData.title = resp.Title;
            this.gameData.type = resp.GameType;
            this.gameData.instanceId = instanceId;
            this.gameData.streamConfig = resp.StreamConfig;
            this.gameData.state = GameState.init;
            if (resp.HlsUrl) {
              this.gameData.streamUrl = resp.HlsUrl;
              this.gameData.streamType = StreamType.hls;
            } else if (resp.RtmpUrl) {
              this.gameData.streamUrl = resp.RtmpUrl;
              this.gameData.streamType = StreamType.rtmp;
            }else if (resp.WebRTCUrl) {
              this.gameData.streamUrl = resp.WebRTCUrl;
              this.gameData.streamType = StreamType.webrtc;
            }
           }

          return data;
        },
        error => error
      ));
  }

  initGameConfig() {
    return this.apiService.initializeGameUrls();
  }

  joinGame(instanceId) {
    const self = this;
    this.messageId = 0;
    return this.apiService.get(`join/${instanceId}/`)
      .pipe(map(
        data => {
          if (data.IsSuccess) {
            this.userData.currencySign = data.ResponseData.UserData.CurrencySign;
            this.userData.currencyMultiplier = data.ResponseData.UserData.CurrencyMultiplier;
            this.userData.currencyName = data.ResponseData.UserData.CurrencyName;
            this.userData.localeId = data.ResponseData.UserData.LocaleId;
            this.gameData.gameFeatures = data.ResponseData.UserData['GameFeatures'];
            this.gameData.gameFeatures.hasCloseButton = !this.gameData.gameFeatures.hasOwnProperty('hasCloseButton') ? true : this.gameData.gameFeatures.hasCloseButton;
            this.gameData.gameFeatures.hasChat = !this.gameData.gameFeatures.hasOwnProperty('hasChat') ? false : this.gameData.gameFeatures.hasChat;
            this.gameData.disabled = true;
            this.gameData.state = GameState.closed;
            this.isAuthenticatedSubject.next(true);
            interval(5000 * 60).subscribe(x => {
              this.keepAlive(this.instanceId);
            });
          } else {
            if (self.lobbyUrl) {
              document.location.href = self.lobbyUrl;
            } else {
              if (!self.sendMessageToParent({type: 'refresh'})) {
                window.location.reload();
              }
            }
          }
          return data;
        },
        error => error
      ));
  }

  updateHistory(filters) {
    const self = this;
    let path = '';
    const betCount = 100;
    if (filters) {
      if (filters.roundId) {
        path = `bet_report/*/?date=${formatDate(new Date(), 'yyyy-MM-dd', 'EN', '+0000')}_&maxBets=${betCount}&roundId=${filters.roundId}`;
      } else {
        if (filters.fromDate && filters.toDate) {
          filters.fromDate.setHours(0, 0, 0);
          filters.toDate.setHours(24, 59, 0);
          const fDate = formatDate(filters.fromDate, 'yyyy-MM-dd-HH-mm-ss', 'EN');
          const tDate = formatDate(filters.toDate, 'yyyy-MM-dd-HH-mm-ss', 'EN');
          path = `bet_report/*/?date=${fDate}_${tDate}&maxBets=1000`;
        } else if (filters.fromDate) {
          path = `bet_report/*/?date=${formatDate(filters.fromDate, 'yyyy-MM-dd', 'EN', '+0000')}_&maxBets=${betCount}`;
        } else if (filters.toDate) {
          path = `bet_report/*/?date=_${formatDate(filters.toDate, 'yyyy-MM-dd', 'EN', '+0000')}&maxBets=${betCount}`;
        } else {
          path = `bet_report/*/?date=${formatDate(new Date(), 'yyyy-MM-dd', 'EN', '+0000')}&maxBets=${betCount}`;
        }
      }
    } else {
      path = `bet_report/*/?date=${formatDate(new Date(), 'yyyy-MM-dd', 'EN', '+0000')}&maxBets=${betCount}`;
    }
    this.apiService.get(path)
      .pipe().subscribe(
      data => {
        if (data.IsSuccess) {
          const groups = data.ResponseData.reduce((group, bet) => {
            const roundId = bet.roundId;
            if (!group[roundId]) {
              group[roundId] = [];
            }
            group[roundId].push(bet);
            return group;
          }, {});
          this.historyBets = Object.keys(groups).map((roundId) => {
            return {
              date: moment(groups[roundId][0].date).format('DD-MM-YYYY'),
              roundId,
              gameId: groups[roundId][0].gameId,
              currencySign: groups[roundId][0].currencySign,
              betAmount: groups[roundId].reduce((a, b) => {
                return a + b.betAmount;
              }, 0),
              winAmount: groups[roundId].reduce((a, b) => {
                return a + (b.winAmount > 0 ? b.winAmount : -b.betAmount);
              }, 0),
              bets: groups[roundId]
            };
          });
        }
        return data;
      },
      error => {
        console.log(error);
      },
    );
  }

  updateResults(filters) {
    const self = this;
    let path = '';
    const resultCount = 100;
    if (filters) {
      if (filters.roundId) {
        path = `result_report/${this.instanceId}/${formatDate(filters.date, 'yyyy-MM-dd', 'EN',  '+0000')}/${filters.drawId}/`;
      }if (filters.fromDate || filters.to) {
        const now = new Date();
        let fromDate = new Date(filters.date);
        if (filters.fromDate) {
          fromDate.setHours(parseInt(filters.fromDate.split(':')[0], 10), parseInt(filters.fromDate.split(':')[1], 10), 0);
        } else {
          fromDate.setHours(0, 0, 0);
        }
        fromDate = new Date(fromDate.getTime() + now.getTimezoneOffset() * 60000);
        let toDate = new Date(filters.date);
        if (filters.toDate) {
          toDate.setHours(parseInt(filters.toDate.split(':')[0], 10), parseInt(filters.toDate.split(':')[1], 10), 0);
        } else {
          toDate.setDate(toDate.getDate() + 1);
          toDate.setHours(0, 0, 0);
        }
        toDate = new Date(toDate.getTime() + now.getTimezoneOffset() * 60000);
        const fDate = formatDate(fromDate, 'yyyy-MM-dd-HH-mm-ss', 'EN');
        const tDate = formatDate(toDate, 'yyyy-MM-dd-HH-mm-ss', 'EN');
        path = `result_report/${this.instanceId}/${fDate}_${tDate}/0/`;
      } else {
        path = `result_report/${this.instanceId}/${formatDate(new Date(), 'yyyy-MM-dd', 'EN', '+0000') }/0/`;
      }
    } else {
      path = `result_report/${this.instanceId}/${formatDate(new Date(), 'yyyy-MM-dd', 'EN', '+0000') }/10/`;
    }
    this.apiService.get(path)
        .pipe().subscribe(
        data => {
          if (data.IsSuccess) {
            this.results = [];
            for (const hItem of data.ResponseData) {
              this.results.push({
                time:new Date(hItem.date.replace(/-/g, '/') + ' UTC'),
                result : JSON.parse(hItem.result).split('-'),
                draw : hItem.roundId,
                videoLink : hItem.videoLink,
              });
            }
          }
          return data;
        },
        error => {
          console.log(error);
        },
    );
  }

  keepAlive(instanceId) {
    this.apiService.get(`keep_alive/${instanceId}/`).pipe().subscribe(
      data => {
      }
    );
  }

  getVideoToken(streamId){
    return this.send({'type':'video_token', 'streamId':streamId});
  }
  send(jsonData) {
    const self = this;
    return this.apiService.post(`post/${this.instanceId}/`, jsonData).pipe(map(
      data => {
        if (!data.IsSuccess) {
          if (data.ResponseData === 100) {
            this.gameData.state = GameState.paused;
            this.gameData.disableTime = 0;
          }
        }
        return data;
      },
      error => error
    ));
  }

  openSocketConnection(instanceId) {
    const self = this;
    const webSocket = new WebSocket(this.apiService.ws_server_url);
    webSocket.onopen = function () {
      console.log('Connection is open...');
      self.sessionExpired = false;
    };
    webSocket.onmessage = function (evt) {
      const data = JSON.parse(evt.data);
      if (data.type === 'ready') {
        webSocket.send(JSON.stringify({
          type: 'init',
          instanceId: instanceId,
          sessionToken: self.getToken()
        }));
      } else if (data.type === 'message') {
        try {
          const msg = data.data;
          if (msg.Type === 0) {
            const jsonMsg = JSON.parse(msg.Message);
            self.messageEvent.emit({instanceId: data.instanceId, payload: jsonMsg, date: data.date});
          } else if (msg.Type === MessageType.Shutdown || msg.Type === MessageType.Restart || msg.Type === MessageType.Disable) {
            if (self.lobbyUrl) {
              document.location.href = self.lobbyUrl;
            } else {
              if (!self.sendMessageToParent({type: 'refresh'})) {
                window.location.reload();
              }
            }
          } else if (msg.Type === MessageType.Enable || msg.Type === MessageType.Initialize) {
            self.gameData.state = GameState.closed;
            self.gameData.disabled = false;
          } else if (msg.Type === MessageType.System) {
            const jsonMsg = JSON.parse(msg.Message);
            self.messageEvent.emit({instanceId: data.instanceId, payload: jsonMsg});
          } else if (msg.Type === MessageType.Popup) {
            const jsonMsg = JSON.parse(msg.Message);
            self.messageEvent.emit({instanceId: data.instanceId, payload: jsonMsg});
          }
        } catch (err) {
          console.log(data.data);
          console.error('Message dispatch error!');
          console.error(err);
        }
      } else if (data.type === 'unsubbed') {
        self.gameData.state = GameState.paused;
        self.gameData.disabled = true;
        self.gameData.disableTime = 0;
        self.errorEvent.emit({error: 'Session expired'});
      } else if (data.type === 'expire') {
        console.log('session expired');
        self.sessionExpired = true;
        self.gameData.state = GameState.paused;
        self.gameData.disableTime = 0;
        self.errorEvent.emit({error: 'Multisession not available'});
     }
    };

    webSocket.onclose = function () {
      console.log('Socket connection is closed...');
      function reJoin(){
        self.joinGame(instanceId).subscribe(
          gameData => {
            if (gameData.IsSuccess) {
              self.openSocketConnection(instanceId);
            } else {
              console.error(gameData);
              setTimeout(x=>{
                reJoin();
              },3000);
            }
          },
          err => {
            console.error(err);
            setTimeout(x=>{
              reJoin();
            },3000);
          }
        );
      }
      if (!self.sessionExpired) {
        reJoin();
      }
    };
  }

}
