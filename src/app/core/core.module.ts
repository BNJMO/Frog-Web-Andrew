import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {HttpTokenInterceptor} from './interceptors';

import {
  ApiService,
  GameService
} from './services';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: HttpTokenInterceptor, multi: true},
    ApiService,
    GameService],
  declarations: []

})
export class CoreModule {
}
