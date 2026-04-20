import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { catchError, first, Observable, switchMap, tap, throwError, timeout, timer } from 'rxjs';
import { combine, Environment } from '@olmi/model';
import { ServerBusyService } from './server-busy.service';

/**
 * Ambiente applicativo (baseUrl delle API). Lo stesso token può essere
 * usato per inietterlo negli interceptor.
 */
export const SUDOKU_ENVIRONMENT = new InjectionToken<Environment>('SUDOKU_ENVIRONMENT');

interface AppStateResponse {
  state: 'idle' | 'busy';
  task?: string;
  progress?: number;
  startedAt?: number;
  elapsedMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_MAX_WAIT_MS = 90_000;
const BUSY_CODE = 'server-busy';

/**
 * Interceptor funzionale: quando una richiesta HTTP fallisce con
 * `503 { code: 'server-busy' }`, polla `GET /api/status` finché
 * lo stato diventa `idle`, poi ri-esegue **una sola volta** la
 * richiesta originale. Se l'attesa supera `DEFAULT_MAX_WAIT_MS`
 * l'observable viene rigettato con un `TimeoutError` che la UI
 * può intercettare per mostrare "Server in crisi".
 *
 * Tutte le altre risposte (anche 503 con codici diversi, es.
 * `ocr-queue-timeout`) vengono propagate inalterate.
 */
export const serverBusyInterceptor: HttpInterceptorFn = (req, next) => {
  const busy = inject(ServerBusyService);
  const env = inject(SUDOKU_ENVIRONMENT);
  const backend = inject(HttpBackend);
  // HttpClient che bypassa gli interceptor (polling di /status non deve
  // rientrare in questo stesso flusso e innescare ricorsione)
  const rawHttp = new HttpClient(backend);
  const statusUrl = combine(env.baseUrl||'', 'status');

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 503 || err.error?.code !== BUSY_CODE) {
        return throwError(() => err);
      }
      return waitAndRetry(req, next, rawHttp, statusUrl, busy, err);
    })
  );
};

function waitAndRetry(
  req: Parameters<HttpInterceptorFn>[0],
  next: Parameters<HttpInterceptorFn>[1],
  http: HttpClient,
  statusUrl: string,
  busy: ServerBusyService,
  err: HttpErrorResponse
): Observable<any> {
  const waitStart = Date.now();
  // stato iniziale derivato dal body del 503 (così la UI non deve aspettare il primo poll)
  const initialBody = err.error || {};
  busy.set({
    task: initialBody.task || 'unknown',
    progress: initialBody.progress,
    startedAt: initialBody.startedAt,
    waitElapsedMs: 0,
  });

  return timer(0, DEFAULT_POLL_INTERVAL_MS).pipe(
    switchMap(() => http.get<AppStateResponse>(statusUrl)),
    tap(state => {
      if (state.state === 'busy') {
        busy.set({
          task: state.task || 'unknown',
          progress: state.progress,
          startedAt: state.startedAt,
          waitElapsedMs: Date.now() - waitStart,
        });
      }
    }),
    first(state => state.state === 'idle'),
    timeout(DEFAULT_MAX_WAIT_MS),
    tap({
      next: () => busy.clear(),
      error: () => busy.clear(),
    }),
    switchMap(() => next(req))
  );
}
