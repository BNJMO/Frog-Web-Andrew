import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Utils } from '../../shared/utils';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared';
import { GameService, UserData } from '../../core';
import { FlameComponent } from "../flame/flame.component";

@Component({
  selector: 'app-lane',
  standalone: true,
  imports: [CommonModule, TranslateModule, SharedModule, FlameComponent],
  templateUrl: './lane.component.html',
  styleUrl: './lane.component.scss',
  animations: [
    trigger('cAnim', [
      state('up', style({ top: '-100%' })),
      state('stop', style({ top: '27%' })),
      state('down', style({ top: '200%' })),
      transition('up => down', animate('1000ms ease-in-out')),
      transition('up => stop', animate('500ms ease-in-out')),
      transition('down => up', animate('0ms ease-in-out'))
    ]),
    trigger('alligatorAnim', [
      state('up', style({ top: '70%', opacity: 1 })),
      state('cut', style({ top: '53%', opacity: 1 })),
      state('down', style({ top: '70%', opacity: 0 })),
      transition('up => down', animate('1000ms ease-in-out')),
      transition('up => stop', animate('500ms ease-in-out')),
      transition('down => up', animate('500ms ease-in-out')),
      transition('up => cut', animate('500ms ease-in-out'))
    ])
  ]
})
export class LaneComponent {
  isMobile = new Utils().isMobile();
  showBarrier = false;
  cut = false;
  fall = false;
  hitBarrier = false;
  fried = false;
  falmeInHole = false;
  stopped = false;
  animateCar = false;
  animateAlligator = false;
  animationId = 1;
  carId = Math.floor(Math.random() * 4);
  @Input() id;
  @Input() betAmount;
  @Input() posId;
  @Input() rate;
  @Input() difficultyLevelId;
  @Input() allowJump;
  @Output() posClick = new EventEmitter();
  constructor(public userData: UserData, public gameService: GameService) {
  }
  reset() {
    this.showBarrier = false;
    this.hitBarrier = false;
    this.cut = false;
    this.fall = false;
    this.fried = false;
    this.stopped = false;
    this.falmeInHole = false;
    this.animateCar = false;
    this.animateAlligator = false;
    this.animationId = 1;
    this.carId = Math.floor(Math.random() * 4);
  }
  showBarriers() {
    this.showBarrier = true;
  }
  stop() {
    this.stopped = true;
  }
  moveCar() {
    return new Promise((resolve) => {
      if (!this.stopped) {
        if (!this.showBarrier) {
          this.animateCar = true;
          setTimeout(() => {
            resolve(true);
            setTimeout(() => {
              if (!this.showBarrier) {
                this.hitBarrier = false;
                this.animateCar = false;
              }
            }, 500);
          }, 500);
        } else {
          setTimeout(() => {
            this.hitBarrier = true;
          }, 500);
          this.animateCar = true;
          resolve(false);
        }
      }
    });
  }
  showFlame() {
    if (!this.stopped) {
      if (!this.showBarrier) {
        this.falmeInHole = true;
        setTimeout(() => {
          this.falmeInHole = false;
        }, 1500);
      }
    }
  }
  showAlligator() {
    if (!this.stopped) {
      if (!this.showBarrier) {
        this.animateAlligator = true;
        setTimeout(() => {
          this.animationId = 2;
          setTimeout(() => {
            this.animationId = 1;
            this.animateAlligator = false;
          }, 250);
        }, 250);
      }
    }
  }

  fallInHole() {
    return new Promise((resolve) => {
      if (!this.stopped) {
        this.fall = true;
        setTimeout(() => {
          resolve(true);
        }, 1000);
      }
    }
    );
  }


  fry() {
    return new Promise((resolve) => {
      if (!this.stopped) {
        this.fried = true;
        setTimeout(() => {
          resolve(true);
          this.fried = false;
        }, 500);
      }
    }
    );
  }
  rateClick(id){
    const frog = document.getElementById(`lane_${id}`);
    const road = document.getElementById('road');
    if (frog && road) {
      const frogRect = frog.getBoundingClientRect();
      const roadRect = road.getBoundingClientRect();
      const currentScroll = road.scrollLeft;
      const frogOffset = frogRect.left - roadRect.left + currentScroll;
      const scrollTo = frogOffset - road.clientWidth / 2 + frog.clientWidth / 2;
      road.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  }
  getWinRate() {
    return this.id > -1 ? this.gameService.gameData.config.steps[this.difficultyLevelId][this.id] : 0;
  }
  getUsdTotalProfit() {
    return this.betAmount * this.getWinRate() * this.userData.currencyMultiplier;
  }
  getTotalProfit() {
    return this.betAmount * this.getWinRate();
  }
  getWinChange(){
    return this.id > -1 ? this.gameService.gameData.config.probabilities[this.difficultyLevelId][this.id] : 0;
  }
  jump(){
    this.posClick.emit();
  }
}
