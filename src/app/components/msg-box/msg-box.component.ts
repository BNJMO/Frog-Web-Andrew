import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GameService} from '../../core/services';
import {CommonModule} from "@angular/common";
import {TranslateModule} from "@ngx-translate/core";
import {Utils} from "../../shared";

@Component({
  selector: 'app-msg-box',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './msg-box.component.html',
  styleUrls: ['./msg-box.component.scss']
})
export class MsgBoxComponent implements OnInit {

  text;
  params;
  confirmText;
  cancelText;
  confirm;
  cancel;
  visible = false;
  utils = new Utils();

  constructor(public gameService: GameService) {
  }

  ngOnInit() {
  }

  show(cfg, confirmCbx, cancelCbx?) {
    this.text = cfg.text;
    this.params = cfg.params;
    this.confirm = confirmCbx;
    this.cancel = cancelCbx;
    this.confirmText = cfg.confirmText ? cfg.confirmText : 'Ok';
    this.cancelText = cfg.cancelText ? cfg.cancelText : 'Cancel';
    this.visible = true;
  }

  confirmClick(e:any) {
    e.stopPropagation();
    e.preventDefault();
    this.visible = false;
    if (this.confirm) {
      this.confirm();
    }
  }

  cancelClick(e:any) {
    e.stopPropagation();
    e.preventDefault();
    this.visible = false;
    if (this.cancel) {
      this.cancel();
    }
  }

}
