import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mines-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mines-game.component.html',
  styleUrl: './mines-game.component.scss'
})
export class MinesGameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer', { static: true })
  private readonly gameContainer!: ElementRef<HTMLElement>;

  @ViewChild('controlPanelContainer', { static: true })
  private readonly controlPanelContainer!: ElementRef<HTMLElement>;

  private teardown?: () => void;
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    try {
      const module = await import('../../mines/src/main.js');
      if (this.destroyed) {
        module.destroyMinesGame?.();
        return;
      }

      const initializer = module.initializeMinesGame;
      if (typeof initializer !== 'function') {
        throw new Error('initializeMinesGame export not found');
      }

      const instance = await initializer({
        gameMount: this.gameContainer.nativeElement,
        controlPanelMount: this.controlPanelContainer.nativeElement,
      });

      if (this.destroyed) {
        instance?.destroy?.();
        return;
      }

      this.teardown = instance?.destroy;
    } catch (error) {
      console.error('Failed to initialize Mines game', error);
      this.gameContainer.nativeElement.innerHTML = `
        <div class="loading error">Failed to load game</div>
      `;
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    try {
      this.teardown?.();
    } catch (error) {
      console.error('Failed to tear down Mines game', error);
    }
  }
}
