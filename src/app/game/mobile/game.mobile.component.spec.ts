import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Game.MobileComponent } from './mobile.component';

describe('Game.MobileComponent', () => {
  let component: Game.MobileComponent;
  let fixture: ComponentFixture<Game.MobileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Game.MobileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Game.MobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
