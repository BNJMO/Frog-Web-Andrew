import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameDesktopComponent } from './game.desktop.component';
import { MinesGameService } from '../mines-game.service';

describe('GameDesktopComponent', () => {
  let component: GameDesktopComponent;
  let fixture: ComponentFixture<GameDesktopComponent>;
  let minesGame: jasmine.SpyObj<MinesGameService>;

  beforeEach(async () => {
    minesGame = jasmine.createSpyObj<MinesGameService>('MinesGameService', [
      'mount',
      'detach',
      'destroy',
    ]);

    await TestBed.configureTestingModule({
      imports: [GameDesktopComponent],
      providers: [{ provide: MinesGameService, useValue: minesGame }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameDesktopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mounts the mines game when the view is ready', () => {
    const hostElement = fixture.nativeElement.querySelector('.mines-game-container');
    expect(minesGame.mount).toHaveBeenCalledWith(hostElement);
  });

  it('detaches the mines game on destroy', () => {
    const hostElement = fixture.nativeElement.querySelector('.mines-game-container');
    component.ngOnDestroy();
    expect(minesGame.detach).toHaveBeenCalledWith(hostElement);
  });
});
