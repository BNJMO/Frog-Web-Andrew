import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GameService} from '../../core/services';
import {CommonModule} from "@angular/common";
import {TranslateModule} from "@ngx-translate/core";
import { UserData } from '../../core';
import { Utils, SharedModule } from "../../shared";

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule, TranslateModule, SharedModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss']
})
export class ResultComponent implements OnInit {
  visible = false;
  utils = new Utils();
  rate=0;
  amount = 0;
  constructor(public gameService: GameService, public userData: UserData) {
  }

  ngOnInit() {
  }

  show(amount,rate,timeout?) {
    this.amount = amount;
    this.rate = rate;
    this.visible = true;
    setTimeout(() => {
      this.visible = false;
    }, timeout ?? 3000);
  }

}
