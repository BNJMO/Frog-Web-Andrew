import { Component, ElementRef, OnInit, Renderer2, Injectable, RendererFactory2, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { MsgBoxComponent } from '../../components/msg-box/msg-box.component';
import { CookieService } from 'ngx-cookie-service';
import { BetState, GameState, UserData } from '../../core';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedModule, TimerComponent, Utils } from '../../shared';
import { GameService } from '../../core/services';
import { BetType } from '../../core/bet-type.enum';
import { SoundPlayerComponent } from '../../shared/sound-player/sound-player.component';
import { AmountPipe } from "../../shared/amount-pipe";
import { CommonModule } from "@angular/common";
import { ToastComponent } from '../../components/toast/toast.component';
import { FrogComponent } from "../../components/frog/frog.component";
import { LaneComponent } from "../../components/lane/lane.component";
import { ResultComponent } from "../../components/result/result.component";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-game-mobile',
  standalone: true,
  imports: [CommonModule, TranslateModule, SharedModule, MsgBoxComponent, TimerComponent, FrogComponent, LaneComponent, ResultComponent],
  templateUrl: './game.mobile.component.html',
  styleUrls: ['./game.mobile.component.scss']
})
export class GameMobileComponent implements OnInit {
  array = Array;
  autoMode: boolean = false;
  autoPlayStarted: boolean = false;
  betAmount: number = 0;
  difficultyLevelId: number = 0;
  autoGameSteps: number = 1;
  frogPosition: number = -1;
  roadAnimTimeout: any;
  autoGameCount: number = 5;
  gameState = GameState;
  betType = BetType;
  resultShow = false;
  winAmount = 0;
  stateTimeLeft: number;
  stateProgress: number = 100;
  lastChatMessages: any = [];
  selectedChip = 0;
  selectedOdds = null;
  selectedOddsItems = [];
  selectMode = false;
  muted = true
  utils = new Utils();
  stateText = 'No more bets';
  historyShow = false;
  pot = { amount: 0, bets: 0, currencySign: '', potAmounts: [] };
  helpShow = false;
  resultsShow = false;
  showResult = false;
  statVisible = false;
  msgShow = true;
  instaBets = false;
  limitShow = false;
  viewModeChanged = true;
  showChat = false;
  disabledLive = false;
  outcomesShow = false;
  menuShow = false;
  gKey = '';
  bets = [];
  chipsValueArr = [1, 5, 10, 25, 50, 100];
  chatMessages = [];
  selectedBets = [];
  statisitcs = {};
  isSubmitting = false;
  isAnimating = false;
  authSubscription: Subscription;
  openRoundTimeout;
  svgaPlayer;
  gameForm: FormGroup;
  audioFiles = [
    { name: 'BackgroundRoad', type: 'wav' },
    { name: 'CarCrash_1', type: 'wav' },
    { name: 'CarSmashedFrog', type: 'wav' },
    { name: 'FrogBurned', type: 'wav' },
    { name: 'FrogJump_1', type: 'wav' },
    { name: 'FrogSmashed_1', type: 'wav' },
    { name: 'Win', type: 'wav' },

    { name: 'barricade', type: 'mp3' },
    { name: 'hit', type: 'mp3' },
    { name: 'jump', type: 'mp3' },
    { name: 'lose', type: 'mp3' },
    { name: 'lose2', type: 'mp3' },
    { name: 'placeChip', type: 'mp3' },
    { name: 'clickingFail', type: 'mp3' },
    { name: 'startAutoPlay', type: 'mp3' },
    { name: 'openPopup', type: 'mp3' },
    { name: 'clickUIButton', type: 'mp3' }
  ];

  @ViewChild(SoundPlayerComponent, {}) soundPlayer: SoundPlayerComponent;
  @ViewChild(MsgBoxComponent, {}) msgBox: MsgBoxComponent;
  @ViewChild(ToastComponent, {}) toast: ToastComponent;
  @ViewChild(FrogComponent, {}) frog: FrogComponent;
  @ViewChild(ResultComponent, {}) result: ResultComponent;
  @ViewChild('svgaCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChildren('lanes') lanes!: QueryList<LaneComponent>;


  constructor(public userData: UserData, public gameService: GameService, private cookieService: CookieService,
    private renderer: Renderer2, private elementRef: ElementRef, private translate: TranslateService, private amountPipe: AmountPipe, private fb: FormBuilder) {
  }

  ngOnInit() {
    this.gameService.messageEvent.subscribe(
      (data: any) => {
        this.messageDispatcher(data);
      });
    this.gameService.errorEvent.subscribe(
      (data: any) => {
        this.msgBox.show({
          text: data.error,
          confirmText: 'Ok'
        },
          () => {
            this.exit();
          });
      });
    this.authSubscription = this.gameService.isAuthenticated.subscribe(
      (isAuthenticated) => {
        this.soundPlayer.preloadAudio(this.audioFiles);
        this.soundPlayer.setVolume(0);
        if (isAuthenticated) {
          this.getLimits();
        }
      }
    );

  }
  ngAfterViewInit(): void {
    document.getElementById('frog')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
  }
  messageDispatcher(message) {
    const self = this;
    const payload = message.payload;
    const msg = payload.message;
    if (payload.type === 'user') {
      this.userData.balance = parseFloat(msg.balance);
      this.userData.sessionId = msg.sessionId;
      this.userData.nick = msg.user.nick;
      this.userData.id = msg.user.externalUserId ?? msg.user.sessionId;
      this.userData.avatar = msg.user.avatar;
      if (this.userData.balance <= 0) {
        this.toast.show("Insufficient Balance", "error", 5000);
      }
    } else if (payload.type === 'balance') {
      this.userData.balance = parseFloat(msg.balance);
    } else if (payload.type === 'status' || payload.type === 'current_status') {
      switch (parseInt(msg.status, 10)) {
        case GameState.opened:
        case GameState.reopened: {
          self.gameService.gameData.state = parseInt(msg.status, 10);
          if (payload.message.streams && msg.streams.hls) {
            self.gameService.gameData.streamUrl = msg.streams.hls;
          }
          self.gameService.gameData.prevRoundBets = self.gameService.gameData.bets.slice();
          self.gameService.gameData.bets = [];
          self.gameService.gameData.userBets = [];
          self.stateText = 'Place your bets';
          self.gameService.gameData.drawId = msg.round_id;
          self.gKey = msg.gKey;
          this.openRoundTimeout = setTimeout(() => {
            this.gameService.gameData.result = null;
            this.showResult = false;
            this.statVisible = true;
            self.winAmount = 0;
          }, 2000);
          break;
        }
        case GameState.closed: {
          this.statVisible = false;
          this.selectedBets = [];
          this.gameService.gameData.state = parseInt(msg.status, 10);
          this.stateText = 'No more bets';
          this.gameService.gameData.roundLength = 0;
          this.gameService.gameData.drawId = msg.round_id;
          break;
        }
        case GameState.drawing: {
          this.gameService.gameData.state = parseInt(msg.status, 10);
          this.stateText = 'No more bets';
          this.gameService.gameData.roundLength = 0;
          this.gameService.gameData.drawId = msg.round_id;
          if (msg.result) {
            this.gameService.gameData.result = msg.result;
          }
          break;
        }
        case GameState.result:
        case GameState.drawCompleted: {
          this.winAmount = 0;
          this.gameService.gameData.state = parseInt(msg.status, 10);
          this.gameService.gameData.roundLength = 0;
          if (msg.result) {
            if (msg.result != "0") {
              this.result.show(this.gameService.gameData.bets[0].amount * msg.result, msg.result, 1000);
            }
            this.gameService.gameData.result = msg.result;
            this.gameService.gameData.history.push(msg);
            if (this.gameService.gameData.history.length > 9) {
              this.gameService.gameData.history = this.gameService.gameData.history.slice(-9);
            }
            this.showResult = true;
          }
          break;
        }
        case GameState.cancelled: {
          this.gameService.gameData.bets = [];
          this.msgBox.show({
            text: "This race has been void, your bets are refunded",
            confirmText: 'Ok'
          },
            () => {
              console.log('confirm');
            });
          break;
        }
      }
    } else if (payload.type === 'crash_update') {
      if (payload.status == "Lost") {
        this.frogPosition++;
        this.jump(this.frogPosition, true);
      } else {
        if (this.frogPosition != payload.step) {
          this.frogPosition = payload.step;
          this.jump(this.frogPosition, false);
        }

      }
    } else if (payload.type === 'bets') {
      msg.bets.forEach(b => {
        this.gameService.gameData.bets.push(b);
      });
    } else if (payload.type === 'pot') {
      this.pot = payload;
    } else if (payload.type === 'bets_registered') {
      msg.bets.forEach(b => {
        const bet = this.gameService.gameData.bets.find(x => x.uuid === b.uuid
          && x.roundBetId === b.roundBetId);
        if (bet) {
          bet.state = BetState.accepted;
        } else {
          this.gameService.gameData.bets.push(b);
        }
      });
      self.frogPosition = -1;
      self.stopGameAnim();
      self.startGameAnim();
      self.frog.reset();
      self.lanes.toArray().forEach(l => l.reset());
      self.soundPlayer.play('BackgroundRoad');

    } else if (payload.type === 'bets_canceled' || payload.type === 'bets_cancelled') {
      msg.bets.forEach((cBet) => {
        const bet = this.gameService.gameData.bets.find(x => x.uuid === cBet.uuid
          && x.roundBetId === cBet.roundBetId);
        if (bet) {
          if (bet.amount.toPrecision(3) > cBet.amount) {
            bet.amount -= cBet.amount;
          } else {
            bet.state = BetState.canceled;
            this.gameService.gameData.bets.splice(this.gameService.gameData.bets.indexOf(bet), 1);
          }
        }
      });
    } else if (payload.type === 'bets_failed') {
      this.msgBox.show({
        text: 'Bet failed!',
        confirmText: 'Ok'
      },
        () => {
          console.log('confirm');
        });
      msg.bets.forEach((cBet) => {
        const bet = this.gameService.gameData.bets.find(x => x.uuid === cBet.uuid
          && x.roundBetId === cBet.roundBetId);
        if (bet) {
          if (bet.amount.toPrecision(3) > cBet.amount) {
            bet.amount -= cBet.amount;
          } else {
            bet.state = BetState.canceled;
            this.gameService.gameData.bets.splice(this.gameService.gameData.bets.indexOf(bet), 1);
          }
        }
      });
    } else if (payload.type === 'chat') {
      this.chatMessages.push({ nick: payload.nick, message: payload.message });
    } else if (payload.type === 'chatHistory') {
      payload.message.forEach(m => {
        this.chatMessages.push({ nick: m.nick, message: m.message });
      });
    } else if (payload.type === 'statistics') {
    }  else if (payload.type === 'win') {
      this.winAmount = msg.bets.map(x => x.amount).reduce((a, b) => a + b);
    } else if (payload.type === 'history') {
      this.gameService.gameData.history = msg.data.slice(-9);
    } else if (payload.type === 'current_dealer') {
      this.gameService.gameData.dealerName = msg.dealerName;
    } else if (payload.type === 'autoplay_end') {
      this.autoPlayStarted = false;
    } else if (payload['popup']) {
      this.msgBox.show({
        text: payload['popup'],
        confirmText: 'Ok',
        cancelText: 'Cancel'
      },
        () => {
          console.log('User select continue gambling');
        }, () => {
          self.exit();
        });
    }
  }
  gameCLick() {
    this.soundPlayer.setVolume(1);
  }


  getLimits() {
    this.gameService
      .send({
        type: 'get_limits'
      })
      .subscribe(
        data => {
          if (data.IsSuccess) {
            const resp = data.ResponseData;
            if (resp?.success) {
              this.gameService.gameData.limits = resp.limits[0];
              this.chipsValueArr = resp.limits[0]['Chips'].slice(0, 7);
            }
            this.getConfig();
          } else {
            console.error(data);
          }
        },
        err => {
          console.error(err);
        }
      );
  }

  getConfig() {
    this.gameService
      .send({
        type: 'config'
      })
      .subscribe(
        data => {
          if (data.IsSuccess) {
            const resp = data.ResponseData;
            if (resp?.success) {
              this.gameService.gameData.config = resp.data.configuration;
              this.betAmount = resp.data.configuration.MinBet;
              this.gameForm = this.fb.group({
                amount: [
                  this.betAmount,
                  [
                    Validators.required,
                    Validators.min(resp.data.configuration.MinBet),
                    Validators.max(resp.data.configuration.MaxBet)
                  ]
                ],
                count: [
                  3,
                  [
                    Validators.required,
                    Validators.min(1),
                    Validators.max(20)
                  ]
                ]
              });
            }
          } else {
            console.error(data);
          }
        },
        err => {
          console.error(err);
        }
      );
  }

  confirm(e) {
    e.stopPropagation();
    if (!this.instaBets) {
      this.soundPlayer.play('clickUIButton');
      this.confirmBets(this.selectedBets);
    }
  }
  confirmBets(bets) {
    const self = this;
    this.isSubmitting = true;
    this.soundPlayer.play('clickUIButton');
    this.gameService
      .send({
        type: 'bet',
        bets: bets
      })
      .subscribe(
        data => {
          this.isSubmitting = false;
          if (data.IsSuccess) {
            const resp = data.ResponseData;
            if (!resp.success) {
              resp.currency = this.userData.currencySign;
              this.msgBox.show({
                text: resp.error,
                params: resp,
                confirmText: 'Ok'
              },
                () => {
                  console.log('confirm');
                });
            } else {
              resp.registeredBets.forEach(b => {
                const bet = this.gameService.gameData.bets.find(x => x.timestamp === b.timestamp
                  && x.roundBetId === b.roundBetId);
                if (!bet) {
                  b.state = BetState.pending;
                  this.gameService.gameData.bets.push(b);
                }
              });
            }
          } else {
            console.error(data);
          }
        },
        err => {
          this.isSubmitting = false;
        },
        () => {
          this.isSubmitting = false;
          let betsArr = bets.filter(() => true);
          betsArr.forEach(bet => {
            let b = this.selectedBets.find(x => x['betInfo'].id == bet['betInfo'].id && x.amount == bet.amount);
            if (b) {
              this.selectedBets.splice(this.selectedBets.indexOf(bet), 1);
            }
          })
        }
      );

  }
  makeBet(bet) {
    let errText = '';
    const vObj = this.checkLimits(bet);
    errText = vObj.errorText;
    if (vObj.valid) {
      this.gameService.gameData.config.odds.forEach(o => {
        o.outcomes.forEach(x => {
          if (x.type === bet.type && x.id == bet.id) {
            bet['betInfo'] = JSON.parse(JSON.stringify(x));
            if (bet.selectedItems?.length > 0) {
              bet['betInfo'].items = bet.selectedItems;
            }
          }
        });
      });
      if (!bet['betInfo']) {
        this.msgBox.show({
          text: 'INVALID_BET',
          confirmText: 'Ok'
        },
          () => {
            console.log('confirm');
          });
        this.soundPlayer.play('clickingFail');
      } else {
        this.soundPlayer.play('placeChip');
        let b = this.selectedBets.find(x => x['betInfo'].items.join(',') == bet.items.join(','));
        if (b) {
          b.amount += bet.amount;
        } else {
          this.selectedBets.push(bet);
        }
        this.confirmBets(this.selectedBets);
      }
    } else if (vObj.errorText) {
      this.msgBox.show({
        text: vObj.errorText,
        confirmText: 'Ok'
      },
        () => {
          console.log('confirm');
        });
      this.soundPlayer.play('clickingFail');
    }
  }

  checkLimits(bet) {
    let type, totalAmount, errText, posAmount;
    let valid = true;
    const validAmount = 0;
    const currentLimits = this.gameService.gameData.limits;
    totalAmount = bet.amount + this.gameService.gameData.bets.map(b => b.amount).reduce((a, b) => a + b, 0);
    totalAmount += this.selectedBets.map(b => b.amount).reduce((a, b) => a + b, 0);
    posAmount = bet.amount + this.gameService.gameData.bets.filter(b => b.betInfo['type'] == bet.type && b.betInfo['id'] == bet['id']).map(b => b.amount).reduce((a, b) => a + b, 0);
    posAmount += this.selectedBets.filter(b => b.betInfo['type'] == bet.type && (b.betInfo['id'] == bet['id'])).map(b => b.amount).reduce((a, b) => a + b, 0);
    if (totalAmount > parseFloat(currentLimits.TableLimit)) {
      this.translate.get('Table Limit Exceeded!').subscribe((text: string) => {
        errText = text;
      });
      valid = false;
    } else if (posAmount > parseFloat(currentLimits.MaxBet) || bet.amount < parseFloat(currentLimits.MinBet)) {
      this.translate.get('Bet limit: {sign}{min}-{sign}{max}', { min: currentLimits.MinBet, max: currentLimits.MaxBet, sign: this.userData.currencySign }).subscribe((text: string) => {
        errText = text;
      });
      valid = false;
    }
    if (validAmount > this.userData.balance) {
      this.translate.get('Insufficient funds!').subscribe((text: string) => {
        errText = text;
      });
      valid = false;
    }
    return { valid, errorText: errText };
  }

  exit() {
    this.soundPlayer.play('clickUIButton');
    window.parent.postMessage({ type: 'home' }, '*');
  }

  onDifficultyChange(event: Event) {
    this.frogPosition = -1;
    this.stopGameAnim();
    this.startGameAnim();
    this.frog.reset();
    this.lanes.toArray().forEach(l => l.reset());
    const select = event.target as HTMLSelectElement;
    this.difficultyLevelId = select.selectedIndex;
  }

  onStepsChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.autoGameSteps = select.selectedIndex + 1;
  }
  autoGameStart() {
    this.gameService
      .send({
        type: 'autoplay',
        amount: this.betAmount,
        count: this.autoGameCount,
        difficulty: this.difficultyLevelId  + 1,
        steps: this.autoGameSteps
      })
      .subscribe(
        data => {
          if (data.IsSuccess) {
            const resp = data.ResponseData;
            if (!resp.success) {
              this.msgBox.show({
                text: resp.error,
                confirmText: 'Ok'
              },
                () => {
                  console.log('confirm');
                });
            } else {
              this.autoPlayStarted = true;
              this.soundPlayer.play('startAutoPlay');
            }
          } else {
            this.msgBox.show({
              text: data.Message,
              confirmText: 'Ok'
            },
              () => {
                console.log('confirm');
              });
            console.error(data);
          }
        },
        err => {
          console.error(err);
        }
      );
  }
  autoGameStop() {
    this.gameService
      .send({
        type: 'stop_autoplay'
      })
      .subscribe(
        data => {
          if (data.IsSuccess) {
            const resp = data.ResponseData;
            if (!resp.success) {
              this.msgBox.show({
                text: resp.error,
                confirmText: 'Ok'
              },
                () => {
                  console.log('confirm');
                });
            } else {
              this.autoPlayStarted = false;
            }
          } else {
            this.msgBox.show({
              text: data.Message,
              confirmText: 'Ok'
            },
              () => {
                console.log('confirm');
              });
            console.error(data);
          }
        },
        err => {
          console.error(err);
        }
      );
  }
  startGameAnim() {
    this.roadAnimTimeout = setInterval(() => {
      const carLaneId = Math.floor(Math.random() * this.gameService.gameData.config.steps[this.difficultyLevelId].length);
      var carLane = this.lanes.toArray()[carLaneId];
      const flameLaneId = Math.floor(Math.random() * this.gameService.gameData.config.steps[this.difficultyLevelId].length);
      var flameLane = this.lanes.toArray()[flameLaneId];
      if(carLane.showBarrier && !carLane.hitBarrier){
        this.soundPlayer.play('hit');     
      }
      carLane.moveCar();
      flameLane.showFlame();
    }, 500);
  }
  stopGameAnim() {
    if (this.roadAnimTimeout) {
      clearInterval(this.roadAnimTimeout);
    }

  }
  getWinRate() {
    return this.frogPosition > -1 ? this.gameService.gameData.config.steps[this.difficultyLevelId][this.frogPosition] : 0;
  }
  getUsdTotalProfit() {
    return this.betAmount * this.getWinRate() * this.userData.currencyMultiplier;
  }
  getTotalProfit() {
    return this.betAmount * this.getWinRate();
  }
  betHalf() {
    if (this.betAmount / 2 >= this.gameService.gameData.config.MinBet) {
      this.betAmount = this.betAmount / 2;
    }
  }
  betDouble() {
    if (this.betAmount * 2 <= this.gameService.gameData.config.MaxBet) {
      this.betAmount = this.betAmount * 2;
    }
  }
  bet() {
    this.makeBet({ type: 'straight', id: this.difficultyLevelId + 1, amount: this.betAmount });
  }
  cashout() {
    this.gameService
      .send({
        type: 'cashout'
      })
      .subscribe(
        data => {
          if (data.IsSuccess) {
            const resp = data.ResponseData;
            if (!resp.success) {
              this.msgBox.show({
                text: resp.error,
                confirmText: 'Ok'
              },
                () => {
                  console.log('confirm');
                });
            } else {
              this.soundPlayer.play('Win');
            }
          } else {
            this.msgBox.show({
              text: data.Message,
              confirmText: 'Ok'
            },
              () => {
                console.log('confirm');
              });
            console.error(data);
          }
        },
        err => {
          console.error(err);
        }
      );
  }
  nextStep() {
    if (this.frogPosition < this.gameService.gameData.config.steps[this.difficultyLevelId].length - 1) {
      if (!this.isSubmitting && !this.isAnimating) {
        this.isSubmitting = true;
        this.isAnimating = true;
        this.gameService
          .send({
            type: 'step'
          })
          .subscribe(
            data => {
              this.isSubmitting = false;
              if (data.IsSuccess) {
                const resp = data.ResponseData;
                if (!resp.success) {
                  this.msgBox.show({
                    text: resp.error,
                    confirmText: 'Ok'
                  },
                    () => {
                      console.log('confirm');
                    });
                }
              } else {
                this.msgBox.show({
                  text: data.Message,
                  confirmText: 'Ok'
                },
                  () => {
                    console.log('confirm');
                  });
                console.error(data);
              }
            },
            err => {
              console.error(err);
              this.isSubmitting = false;
            }
          );
      }
    } else {
      this.jump(this.frogPosition + 1, false);
    }
  }
  jump(posId, lost) {
    if (posId < this.gameService.gameData.config.steps[this.difficultyLevelId].length) {
      let lane = this.lanes.toArray()[posId];
      if (!lost) {
        lane?.showBarriers();
        this.soundPlayer.play('CarCrash_1');
      }
      this.soundPlayer.play('FrogJump_1');
      this.frog.jump(posId, this.autoPlayStarted || lost).then(() => {
        if (lost) {
          const r = Math.random();
          if (r < 0.8) {
            lane.moveCar().then((res) => {
              if (res) {
                lane.stop();
                this.soundPlayer.play('FrogSmashed_1');
                this.frog.squash();
              }
            });
          } else if (r < 0.9) {
            lane.fry().then(() => {
              this.soundPlayer.play('FrogBurned');
              this.frog.fry();
              lane.stop();
            });
          } else {
            lane.fallInHole().then(() => {
              this.soundPlayer.play('FrogSmashed_1');
              lane.stop();
            });
          }
        }
        this.isAnimating = false;
      });
    } else {
      this.frog.finish(this.autoPlayStarted);
      this.isAnimating = false;
    }

  }

}
