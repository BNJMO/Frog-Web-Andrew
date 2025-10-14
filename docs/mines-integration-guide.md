# Integrating the Mines PixiJS game

This document outlines how to embed the external **Mines** PixiJS client inside the existing Angular wagering shell. It covers both the Angular wiring that is already present in this repository and the small changes that will make the Mines bundle easier to mount.

## 1. Understand the existing flow

Before embedding a new renderer, review the lifecycle that the current frog game follows:

1. `AppComponent` reads query parameters, stores the session token, resolves the REST/WebSocket hosts, and only then joins the game instance. When the join request succeeds it opens the WebSocket so that real-time state updates begin flowing.【F:src/app/app.component.ts†L1-L89】【F:src/app/core/services/api.service.ts†L1-L48】
2. `GameService` exposes the session primitives that every feature component relies on: it performs the HTTP `POST` calls that carry player actions (`send(...)`), emits live socket messages to the UI (`messageEvent`/`errorEvent`), and keeps the hydrated `gameData` structure in sync with the authoritative server state.【F:src/app/core/services/game.service.ts†L1-L332】
3. Presentation components (for example `GameDesktopComponent`) subscribe to those service events to drive their UI, react to state transitions (`GameState`), and submit bets through `GameService.send(...)`.【F:src/app/game/desktop/game.desktop.component.ts†L1-L200】

Your Mines integration needs to respect this separation of concerns: reuse the existing REST+socket lifecycle for networking, and only replace the rendering/interaction layer that currently paints the frog game.

## 2. Add the Mines renderer as a standalone component

1. Install PixiJS and any Mines-specific runtime dependencies (Howler, GSAP, etc.) with `npm install pixi.js <other-packages> --save` so Angular can bundle them.
2. Create a new standalone component (e.g. `MinesGameComponent`) under `src/app/game/mines/`. The template can be a simple container div that the PixiJS app mounts into. Keep the component API the same on desktop and mobile by wrapping it in thin shell components if you need layout differences.
3. In `ngAfterViewInit`, instantiate the Mines game, passing the host element from `ViewChild`. Use dependency injection to grab `GameService` and `UserData` so the component can listen to balance updates and state transitions.
4. Subscribe to `gameService.messageEvent` and translate the payloads that the back end already emits into Mines game method calls (e.g. `minesApi.startRound`, `minesApi.reveal`, `minesApi.resolve`). Likewise, wire `GameService.errorEvent` to display fatal error states.
5. When the Mines game raises player intent events (button clicks, tile reveals, cashout requests), relay them to the existing REST endpoint by calling `gameService.send(...)`. The payload structure should match what the current frog UI posts; if the Mines game requires additional fields, extend the server contract in coordination with the back-end team.
6. Clean up the PixiJS instance in `ngOnDestroy` so Angular route changes free GPU/DOM resources.

> Tip: if you need to expose the PixiJS API to other Angular components (auto-play panels, statistics widgets), wrap the Mines instance in an injectable `MinesFacadeService` so components can share a singleton reference.

## 3. Route the Mines component in the shell

1. Decide whether Mines should replace the frog game entirely or coexist as a separate route. If it replaces the existing gameplay:
   * Update `AppComponent` to render `MinesGameComponent` instead of `GameDesktopComponent`/`GameMobileComponent`, or
   * Keep the device-specific shells but swap out the internal content for Mines while preserving the surrounding UI (balance, chat, bet panel) if those features stay relevant.
2. If Mines is an additional game, add a route in `app.routes.ts` that resolves the correct component based on `gameData.type` or a query parameter. The loader can stay the same because the back end already communicates the instance metadata through `GameService.getGameInfo(...)`.
3. Audit any styles, assets, or services that are frog-specific and either repurpose or remove them when building the Mines shells.

## 4. Provide TypeScript bindings for the Mines API

To consume the PixiJS bundle cleanly from Angular, export a typed wrapper:

```ts
// src/app/game/mines/mines-api.ts
export interface MinesApiOptions {
  container: HTMLElement;
  locale: string;
  currency: string;
  onAction: (action: MinesAction) => void;
  onReady?: () => void;
}

export type MinesAction =
  | { type: 'place-bet'; amount: number; spots: number[] }
  | { type: 'cash-out' }
  | { type: 'select-spot'; index: number };

export interface MinesApi {
  startRound(payload: RoundState): void;
  updateBalance(balance: number): void;
  revealTile(payload: RevealPayload): void;
  endRound(payload: RoundResult): void;
  destroy(): void;
}
```

Your component can then import the compiled Mines bundle and assert that it satisfies `MinesApi`.

## 5. Prompt for the Mines-Demo repository

Feed the following prompt to the Codex instance when you work inside the `Mines-Demo` repository to make the bundle friendlier for Angular:

> **Prompt:**
> 
> We need to embed this PixiJS game into an Angular client that expects to drive the game via an imperative API. Please refactor the code so that:
> 
> 1. The main entry point exports a `createMinesGame(options: MinesApiOptions): MinesApi` factory. The factory must accept an existing DOM container, avoid touching `document.body`, and return an object with `startRound`, `revealTile`, `updateBalance`, `endRound`, and `destroy` methods. Declare the TypeScript typings alongside the build (see `types/` folder) so the Angular app can import them.
> 2. Event callbacks (`onCellRevealed`, `onCashOut`, etc.) should fire through the `onAction` hook provided in the options instead of manipulating the network directly.
> 3. Make all configuration (asset base URL, localization strings, initial bet size) injectable via the `options` parameter rather than hard-coded constants.
> 4. Ensure the PixiJS application cleans up GPU resources in `destroy()` by removing ticker listeners, destroying textures, and detaching event handlers from the host container.
> 5. Export the bundle both as an ES module (for Angular’s build pipeline) and as a standalone UMD build under `dist/mines-game.umd.js` so non-module hosts can still use it.
> 
> Keep the demo wiring in `main.js`, but update it to consume the new factory to verify the API works.

Following these steps will let the Angular client instantiate the Mines experience, forward server-driven state changes, and relay user intent back to the existing REST endpoints without rewriting the networking layer.
