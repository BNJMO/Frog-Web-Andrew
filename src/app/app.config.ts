import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {ApiService, GameService, HttpTokenInterceptor, UserData} from "./core";
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
  HttpHandler,
  provideHttpClient,
  withInterceptorsFromDi
} from "@angular/common/http";
import {provideAnimations} from "@angular/platform-browser/animations";
import {CookieService} from "ngx-cookie-service";
import {TranslateCompiler, TranslateLoader, TranslateModule, TranslateService} from "@ngx-translate/core";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {TranslateMessageFormatCompiler} from "ngx-translate-messageformat-compiler";
import {AmountPipe} from "./shared/amount-pipe";
import {DecimalPipe} from "@angular/common";
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), UserData,
    importProvidersFrom(TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      compiler: {
        provide: TranslateCompiler,
        useClass: TranslateMessageFormatCompiler
      }
    }),),
    TranslateService, TranslateModule, GameService,ApiService, AmountPipe, DecimalPipe, provideAnimations(), provideHttpClient(withInterceptorsFromDi()), {provide: HTTP_INTERCEPTORS, useClass: HttpTokenInterceptor, multi: true}]
};
