import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameMobileComponent } from './game.mobile.component';
import { MinesGameService } from '../mines-game.service';

describe('GameMobileComponent', () => {
  let component: GameMobileComponent;
  let fixture: ComponentFixture<GameMobileComponent>;
  let minesGame: jasmine.SpyObj<MinesGameService>;

  beforeEach(async () => {
    minesGame = jasmine.createSpyObj<MinesGameService>('MinesGameService', [
      'mount',
      'detach',
      'destroy',
    ]);

    await TestBed.configureTestingModule({
      imports: [GameMobileComponent],
      providers: [{ provide: MinesGameService, useValue: minesGame }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mounts the mines game on view init', () => {
    const hostElement = fixture.nativeElement.querySelector('.mines-game-container');
    expect(minesGame.mount).toHaveBeenCalledWith(hostElement, { gameElementId: 'mines-mobile' });
  });

  it('detaches the mines game on destroy', () => {
    const hostElement = fixture.nativeElement.querySelector('.mines-game-container');
    component.ngOnDestroy();
    expect(minesGame.detach).toHaveBeenCalledWith(hostElement);
  });
});
