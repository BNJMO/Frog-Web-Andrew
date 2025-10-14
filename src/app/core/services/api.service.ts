import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpHeaders, HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { throwError } from 'rxjs';
import {catchError, map} from 'rxjs/operators';

@Injectable()
export class ApiService {
  base_server_url: string;
  ws_server_url: string;
  constructor(
    private http: HttpClient,
  ) {}

  private formatErrors(error: any) {
    return  throwError(error.error);
  }

  initializeGameUrls() {
    return this.http.get(`${environment.production ? window.location.origin : ''}${environment.config_url}`, {}).pipe(map(
      data => {
        this.base_server_url = data['BASE_SERVER_URL'];
        this.ws_server_url = data['WS_SERVER_URL'];
        return data;
      },
      error => error
    ));
  }


  get(path: string, params: HttpParams = new HttpParams()): Observable<any> {
    return this.http.get(`${this.base_server_url}${path}`, { params })
      .pipe(catchError(this.formatErrors));
  }

  put(path: string, body: Object = {}): Observable<any> {
    return this.http.put(
      `${this.base_server_url}${path}`,
      JSON.stringify(body)
    ).pipe(catchError(this.formatErrors));
  }

  post(path: string, body: Object = {}): Observable<any> {
    return this.http.post(
      `${this.base_server_url}${path}`,
      JSON.stringify(body)
    ).pipe(catchError(this.formatErrors));
  }

  delete(path): Observable<any> {
    return this.http.delete(
      `${this.base_server_url}${path}`
    ).pipe(catchError(this.formatErrors));
  }
}
