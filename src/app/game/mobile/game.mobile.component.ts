import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import initializeMinesGame from '../../../mines/main.js';

type MinesInstance = Awaited<ReturnType<typeof initializeMinesGame>>;

@Component({
  selector: 'app-game-mobile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.mobile.component.html',
  styleUrls: ['./game.mobile.component.scss'],
})
export class GameMobileComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameHost', { static: true }) gameHost!: ElementRef<HTMLDivElement>;
  @ViewChild('controlHost', { static: true }) controlHost!: ElementRef<HTMLDivElement>;

  private minesInstance?: MinesInstance;

  async ngAfterViewInit(): Promise<void> {
    this.minesInstance = await initializeMinesGame({
      gameMount: this.gameHost.nativeElement,
      controlPanelMount: this.controlHost.nativeElement,
      gameOptions: {
        size: 480,
      },
    });
  }

  ngOnDestroy(): void {
    this.minesInstance?.destroy?.();
    this.minesInstance = undefined;
  }
}
