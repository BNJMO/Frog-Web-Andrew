import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GameService } from '../services';

@Injectable()
export class HttpTokenInterceptor implements HttpInterceptor {
  constructor(
    private gameService: GameService
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headersConfig = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CASINOTV-PROTOCOL-VERSION': '1.1',
    };

    const token = this.gameService.getToken();
    if (token) {
      headersConfig['X-CASINOTV-TOKEN'] = `${token}`;
    }

    const request = req.clone({ setHeaders: headersConfig });
    return next.handle(request);
  }
}
