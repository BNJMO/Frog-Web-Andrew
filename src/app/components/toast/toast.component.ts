import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GameService} from '../../core/services';
import {CommonModule} from "@angular/common";
import {TranslateModule} from "@ngx-translate/core";
import {Utils} from "../../shared";

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {

  text;
  type;
  visible = false;
  utils = new Utils();

  constructor(public gameService: GameService) {
  }

  ngOnInit() {
  }

  show(text, type, timeout?) {
    this.text = text;
    this.type = type;
    this.visible = true;
    setTimeout(() => {
      this.visible = false;
    }, timeout ?? 3000);
  }

}
