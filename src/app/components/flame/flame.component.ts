import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-flame',
  standalone: true,
  templateUrl: './flame.component.html',
  styleUrls: ['./flame.component.scss']
})
export class FlameComponent implements OnInit, OnDestroy {
  currentFrame = '';
  private frame = 1;
  private timer: any;
  private frameCount = 14;
  private prefix = 'assets/img/flame/flame_';

  ngOnInit() {
    this.updateFrame();
    this.timer = setInterval(() => this.updateFrame(), 80);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  updateFrame() {
    const num = String(this.frame).padStart(2, '0');
    this.currentFrame = `${this.prefix}${num}.svg`;
    this.frame = this.frame % this.frameCount + 1;
  }
}