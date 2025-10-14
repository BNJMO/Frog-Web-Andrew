import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChange,
    SimpleChanges
} from '@angular/core';
import {Subscription, timer} from 'rxjs';
import {CommonModule} from "@angular/common";

@Component({
    selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],

  templateUrl: './timer.component.html'
})
export class TimerComponent implements OnInit, OnChanges, OnDestroy {
    sec: number;
    min: number;
    timerSub: Subscription;
    time: number;
    tLeft: number;

    @Input() endDate: Date;
    @Input() endStub: String;
    @Output() onTimeChange = new EventEmitter();

    constructor() {
        this.sec = 0;
        this.min = 0;
    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        const self = this;
        const date: SimpleChange = changes.endDate;
        if (date && date.currentValue) {
            const endDate = new Date(date.currentValue);
            if (endDate) {
                let now = new Date();
                let utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                const timeLeft = (endDate.getTime() - utcNow.getTime()) / 1000;
                this.time = Math.round((endDate.getTime() - utcNow.getTime()) / 1000);
                self.min = Math.floor(timeLeft / 60);
                self.sec = Math.floor(timeLeft % 60);
                const t = timer(0, 1001);
                if (self.timerSub) {
                    self.timerSub.unsubscribe();
                }
                self.timerSub = t.subscribe(t => {
                    now = new Date();
                    utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                    this.tLeft = (endDate.getTime() - utcNow.getTime()) / 1000;
                    if (this.tLeft > 0) {
                        self.min = Math.floor(this.tLeft / 60);
                        self.sec = Math.floor(this.tLeft % 60);
                    } else {
                        self.min = 0;
                        self.sec = 0;
                        self.timerSub.unsubscribe();
                    }
                    let progress = this.tLeft / this.time * 100;
                    this.onTimeChange.emit({time: this.tLeft, progress: progress});
                });
            }
        } else {
            this.onTimeChange.emit({time: 0, progress: 100});
        }

    }


    ngOnDestroy() {
        if (this.timerSub) {
            this.timerSub.unsubscribe();
        }
    }

}
