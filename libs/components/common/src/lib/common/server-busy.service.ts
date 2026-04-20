import { Injectable, InjectionToken } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';

/**
 * Informazioni sullo stato di un task lungo in corso lato server,
 * derivate dalla risposta `GET /api/status` mentre l'interceptor
 * è in attesa per ri-eseguire una richiesta bloccata da un 503.
 */
export interface ServerBusyInfo {
  /** Nome del task in corso (es. "checkAll"). */
  task: string;
  /** Progresso 0..100, se il task lo riporta. */
  progress?: number;
  /** Timestamp ms di inizio del task sul server. */
  startedAt?: number;
  /** Millisecondi trascorsi da quando il client è in attesa. */
  waitElapsedMs: number;
}

/**
 * Servizio globale che espone lo stato "server occupato" per la UI
 * (componenti waiter, banner, spinner). Viene aggiornato dall'HTTP
 * interceptor durante l'attesa.
 */
@Injectable({ providedIn: 'root' })
export class ServerBusyService {
  private readonly _state$ = new BehaviorSubject<ServerBusyInfo | null>(null);

  readonly state$: Observable<ServerBusyInfo | null> = this._state$.asObservable();
  readonly isBusy$: Observable<boolean> = this._state$.pipe(
    map(s => !!s),
    distinctUntilChanged()
  );

  get isBusy(): boolean {
    return !!this._state$.value;
  }

  get current(): ServerBusyInfo | null {
    return this._state$.value;
  }

  set(info: ServerBusyInfo): void {
    this._state$.next(info);
  }

  clear(): void {
    if (this._state$.value !== null) this._state$.next(null);
  }
}

export const SERVER_BUSY_SERVICE = new InjectionToken<ServerBusyService>('SERVER_BUSY_SERVICE');
