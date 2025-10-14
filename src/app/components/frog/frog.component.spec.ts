import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrogComponent } from './frog.component';

describe('FrogComponent', () => {
  let component: FrogComponent;
  let fixture: ComponentFixture<FrogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FrogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
