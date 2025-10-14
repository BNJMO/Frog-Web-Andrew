import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import initializeMinesGame from '../../../mines/main.js';

type MinesInstance = Awaited<ReturnType<typeof initializeMinesGame>>;

@Component({
  selector: 'app-game-desktop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.desktop.component.html',
  styleUrls: ['./game.desktop.component.scss'],
})
export class GameDesktopComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameHost', { static: true }) gameHost!: ElementRef<HTMLDivElement>;
  @ViewChild('controlHost', { static: true }) controlHost!: ElementRef<HTMLDivElement>;

  private minesInstance?: MinesInstance;

  async ngAfterViewInit(): Promise<void> {
    this.minesInstance = await initializeMinesGame({
      gameMount: this.gameHost.nativeElement,
      controlPanelMount: this.controlHost.nativeElement,
    });
  }

  ngOnDestroy(): void {
    this.minesInstance?.destroy?.();
    this.minesInstance = undefined;
  }
}
