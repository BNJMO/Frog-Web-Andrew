import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MinesGameService } from '../mines-game.service';

@Component({
  selector: 'app-game-mobile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.mobile.component.html',
  styleUrls: ['./game.mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMobileComponent implements AfterViewInit, OnDestroy {
  @ViewChild('minesHost', { static: true })
  private readonly minesHost?: ElementRef<HTMLDivElement>;

  constructor(private readonly minesGame: MinesGameService) {}

  ngAfterViewInit(): void {
    const host = this.minesHost?.nativeElement;
    if (host) {
      this.minesGame.mount(host, { gameElementId: 'mines-mobile' });
    }
  }

  ngOnDestroy(): void {
    const host = this.minesHost?.nativeElement;
    if (host) {
      this.minesGame.detach(host);
    } else {
      this.minesGame.destroy();
    }
  }
}
