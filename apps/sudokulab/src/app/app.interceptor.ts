import { Injectable } from '@angular/core';
import { SudokuFacade, SUDOKULAB_BASIC_AUTHORIZATION } from '@sudokulab/model';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

@Injectable()
export class AppInterceptor implements HttpInterceptor {

  constructor(public _sudoku: SudokuFacade) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this._sudoku.selectToken$.pipe(
        take(1),
        switchMap((token) => {
          request = request.clone({
            setHeaders: {
              Authorization: !!token ? `Bearer ${token}` : `Basic ${btoa(SUDOKULAB_BASIC_AUTHORIZATION)}`
            }
          });
          return next.handle(request);
        })
      )
  }
}
