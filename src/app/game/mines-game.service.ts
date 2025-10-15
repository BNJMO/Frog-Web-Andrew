import { Injectable, OnDestroy } from '@angular/core';
import type {
  MinesAction,
  MinesApi,
  MinesApiOptions,
  MinesBalanceUpdate,
  MinesEndRoundOptions,
  MinesRevealOptions,
  MinesStartRoundOptions,
} from '../../../types/mines-game';
import { createMinesGame } from '../../../dist/mines-game.js';
import '../../../dist/assets/style.css';
import { GameService } from '../core/services';

@Injectable({ providedIn: 'root' })
export class MinesGameService implements OnDestroy {
  private api?: MinesApi;
  private host?: HTMLElement;

  constructor(private readonly gameService: GameService) {}

  mount(host: HTMLElement, options: Partial<MinesApiOptions> = {}): MinesApi {
    if (!host) {
      throw new Error('MinesGameService requires a host element to mount the game.');
    }

    if (this.host === host && this.api) {
      return this.api;
    }

    this.destroy();

    const providedOnAction = options.onAction;
    const providedOnReady = options.onReady;
    const finalOptions: MinesApiOptions = {
      ...(options as MinesApiOptions),
      container: host,
      onAction: (action: MinesAction) => {
        this.handleAction(action);
        providedOnAction?.(action);
      },
      onReady: () => {
        providedOnReady?.();
        this.gameService.sendMessageToParent({ type: 'mines-ready' });
      },
    };

    this.api = createMinesGame(finalOptions);
    this.host = host;

    return this.api;
  }

  detach(host: HTMLElement): void {
    if (this.host === host) {
      this.destroy();
    }
  }

  startRound(options?: MinesStartRoundOptions): void {
    this.api?.startRound(options);
  }

  revealTile(options?: MinesRevealOptions): void {
    this.api?.revealTile(options);
  }

  updateBalance(update?: MinesBalanceUpdate): void {
    this.api?.updateBalance(update);
  }

  endRound(result?: MinesEndRoundOptions): void {
    this.api?.endRound(result);
  }

  destroy(): void {
    if (this.api) {
      this.api.destroy();
    }
    this.api = undefined;
    this.host = undefined;
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private handleAction(action: MinesAction): void {
    this.gameService.handleMinesAction(action);
  }
}
