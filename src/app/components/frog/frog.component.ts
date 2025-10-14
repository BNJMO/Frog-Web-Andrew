import { Component, OnDestroy, OnInit } from '@angular/core';
import { Utils } from '../../shared';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-frog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frog.component.html',
  styleUrl: './frog.component.scss'
})
export class FrogComponent implements OnInit, OnDestroy {
  isMobile = new Utils().isMobile();
  state = "still";
  jumpStarted = false;
  frame = 1;
  private timer: any;
  private frameCount = 4;
  ngOnInit() {
    this.updateFrame();
    this.timer = setInterval(() => {
      var c = 0;
      var wink = setInterval(() => {
        c++;
        if (c < this.frameCount) {
          this.updateFrame()
        }
        else {
          clearTimeout(wink);
          this.frame = 1;
        }
      }, 100);
    }, 2000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
  updateFrame() {
    const num = String(this.frame).padStart(2, '0');
    this.frame = this.frame % this.frameCount + 1;
  }
  jump(posId, fastJump = false) {
    return new Promise((resolve) => {
      if (!this.jumpStarted) {
        this.jumpStarted = true;
        this.state = "jump";
        setTimeout(() => {
          this.state = "still";
        }, fastJump ? 0 : 500);
        setTimeout(() => {
          this.state = "still";
          const frog = document.getElementById('frog');
          const road = document.getElementById('road');
          if (frog && road) {
            const frogRect = frog.getBoundingClientRect();
            const roadRect = road.getBoundingClientRect();
            const currentScroll = road.scrollLeft;
            const frogOffset = frogRect.left - roadRect.left + currentScroll;
            const scrollTo = frogOffset - road.clientWidth / 2 + frog.clientWidth / 2;
            road.scrollTo({
              left: scrollTo,
              behavior: 'smooth'
            });
          }
          this.jumpStarted = false;
          resolve(true);
        }, fastJump ? 400 : 750);
        this.moveWithAnimation(document.getElementById('frog'), document.getElementById(`lane_${posId}`), fastJump ? 100 : 700);
      }
    });
  }
  squash() {
    this.state = "squash";
  }

  fry() {
    this.state = "fried";
  }

  kill() {
    this.state = "kill";

  }
  reset() {
    document.getElementById('frogHome').appendChild(document.getElementById(`frog`));
    this.state = "still";
    const frog = document.getElementById('frog');
    const road = document.getElementById('road');
    if (frog && road) {
      const frogRect = frog.getBoundingClientRect();
      const roadRect = road.getBoundingClientRect();
      const currentScroll = road.scrollLeft;
      const frogOffset = frogRect.left - roadRect.left + currentScroll;
      const scrollTo = frogOffset - road.clientWidth / 2 + frog.clientWidth / 2;
      road.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  }

  finish(fastJump = false) {
    if (!this.jumpStarted) {
      this.jumpStarted = true;
      this.state = "jump";
      setTimeout(() => {
        this.state = "still";
      }, fastJump ? 50 : 500);
      setTimeout(() => {
        this.state = "still";
        document.getElementById('frog')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
        this.jumpStarted = false;
      }, fastJump ? 150 : 750);
      this.moveWithAnimation(document.getElementById('frog'), document.getElementById(`frogNewHome`), fastJump ? 150 : 700);
    }
  }

  moveWithAnimation(el: HTMLElement, target: HTMLElement, duration = 700) {
    const start = el.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    el.style.width = rect.width + "px";
    el.style.height = rect.height + "px";
    document.body.appendChild(el);
    el.style.position = "fixed";
    el.style.top = `${start.top}px`;
    el.style.left = `${start.left}px`;
    el.style.margin = "0";
    el.style.zIndex = "9999";
    el.style.pointerEvents = "none";
    const deltaX = end.left - start.left;
    const deltaY = end.top - start.top - 30;
    const startTime = performance.now();
    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const x = start.left + deltaX * progress;
      const arcHeight = -70;
      const y =
        start.top + deltaY * progress + arcHeight * Math.sin(Math.PI * progress);
      el.style.transform = `translate(${x - start.left}px, ${y - start.top}px)`;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        el.style.transform = "";
        el.style.position = "";
        el.style.top = "";
        el.style.left = "";
        el.style.width = "";
        el.style.height = "";
        el.style.zIndex = "";
        el.style.pointerEvents = "";
        target.appendChild(el);
      }
    };
    requestAnimationFrame(animate);
  }
}
