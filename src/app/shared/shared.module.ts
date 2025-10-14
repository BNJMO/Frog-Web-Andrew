import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {RouterModule} from '@angular/router';

import {TimerComponent} from './timer.component';
import {IFrameResizerDirective} from './frame-resizer.directive';
import {ClickOutsideDirective} from './clickOutside.directive';
import { SoundPlayerComponent } from './sound-player/sound-player.component';
import {AmountPipe} from './amount-pipe';
import {MomentDatePipe} from "./momet-date";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    TimerComponent,
  ],
  declarations: [
    IFrameResizerDirective,
    ClickOutsideDirective,
    SoundPlayerComponent,
    AmountPipe,
    MomentDatePipe
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    IFrameResizerDirective,
    ClickOutsideDirective,
    SoundPlayerComponent,
    AmountPipe,
    MomentDatePipe
  ]
})
export class SharedModule {
}
