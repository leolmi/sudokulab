import {Injectable} from '@angular/core';
import {combine} from '@sudokulab/model';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from "../environments/environment";

@Injectable()
export class AppInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const baseUrl = (<any>environment).baseUrl;
    if (baseUrl) {
      const rreq = req.clone({url: /^http/g.test(req.url) ? req.url : combine(baseUrl, req.url)});
      return next.handle(rreq);
    } else {
      return next.handle(req);
    }
  }
}
