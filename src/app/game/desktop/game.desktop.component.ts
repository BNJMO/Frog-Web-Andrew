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
  selector: 'app-game-desktop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.desktop.component.html',
  styleUrls: ['./game.desktop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameDesktopComponent implements AfterViewInit, OnDestroy {
  @ViewChild('minesHost', { static: true })
  private readonly minesHost?: ElementRef<HTMLDivElement>;

  constructor(private readonly minesGame: MinesGameService) {}

  ngAfterViewInit(): void {
    const host = this.minesHost?.nativeElement;
    if (host) {
      this.minesGame.mount(host);
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
