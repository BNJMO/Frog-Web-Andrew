import {Directive, ElementRef, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[appIframeAutoHeight]'
})
export class IFrameResizerDirective implements OnInit {
  private readonly el: any;
  private renderer: Renderer2;


  constructor(_elementRef: ElementRef, _renderer: Renderer2) {
    this.el = _elementRef.nativeElement;
    this.renderer = _renderer;
  }

  ngOnInit() {
    const self = this;
    if (this.el.tagName === 'IFRAME') {
      this.renderer.listen(this.el, 'load', () => {
        setInterval(() => {
          self.setHeight();
        }, 300);
      });
    }
  }

  setHeight() {
    const self = this;
    if (this.el.contentWindow && this.el.contentWindow.document.body) {
      this.renderer.setStyle(
        self.el,
        'height',
        (this.el.contentWindow.document.body.clientHeight + 200) + 'px'
      );
    }
  }
}
