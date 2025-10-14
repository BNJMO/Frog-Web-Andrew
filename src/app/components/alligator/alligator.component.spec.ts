import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlligatorComponent } from './alligator.component';

describe('AlligatorComponent', () => {
  let component: AlligatorComponent;
  let fixture: ComponentFixture<AlligatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlligatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlligatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
