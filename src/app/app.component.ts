import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, RouterOutlet} from '@angular/router';
import {environment} from '../environments/environment';
import {GameService, UserData} from "./core";
import {TranslateModule, TranslateService} from "@ngx-translate/core";
import {CommonModule} from "@angular/common";
import {Utils} from "./shared";
import {GameDesktopComponent} from "./game/desktop/game.desktop.component";
import { GameMobileComponent } from "./game/mobile/game.mobile.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, CommonModule, GameDesktopComponent, GameMobileComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'roulette';
  sessionToken = '';
  isMobile = new Utils().isMobile();

  constructor(private userData: UserData, public gameService: GameService,
              private activatedRoute: ActivatedRoute, private translate: TranslateService) {
    this.translate.setDefaultLang('en');
    this.translate.onLangChange.subscribe(x => {
      this.gameService.currentLang = this.translate.currentLang;
    });
  }

  ngOnInit() {
    this.gameService.sendMessageToParent({type: 'progress', progress: 95});
    this.activatedRoute.queryParams.subscribe(params => {
      this.sessionToken = params['gameToken'];
      this.gameService.instanceId = params['gameId'];
      this.gameService.lobbyUrl = params['lobbyUrl'];

      if (!this.sessionToken) {
        this.sessionToken = this.gameService.getToken();
      }
      if (params['langId']) {
        this.gameService.currentLang = params['langId'];
      } else {
        this.gameService.currentLang = 'en';
      }
      this.translate.use(this.gameService.currentLang);
      this.gameService.setAuth(this.sessionToken);
      if (this.gameService.instanceId) {
        this.gameService.initGameConfig().subscribe(urldata => {
          if (!environment.production && !this.sessionToken) {
            this.gameService.getSessionId('').subscribe(
              token => {
                this.sessionToken = token as string;
                this.gameService.setAuth(this.sessionToken);
                this.gameService.getGameInfo(this.gameService.instanceId).subscribe(
                  (data: any) => {
                    this.join();
                  });
              },
              err => console.log(err)
            );
          } else {
            this.gameService.getGameInfo(this.gameService.instanceId).subscribe(
              (data: any) => {
                this.join();
              });
          }
        });
      }
    });
  }

  join() {
    this.gameService
      .joinGame(this.gameService.instanceId)
      .subscribe(
        gameData => {
          if (gameData.IsSuccess) {
            this.gameService.openSocketConnection(this.gameService.instanceId);
            this.gameService.sendMessageToParent({type: 'progress', progress: 100});
          } else {
            console.error(gameData);
          }
        },
        err => {
          console.error(err);
        }
      );
  }


}
