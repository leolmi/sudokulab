import { computed, Injectable, signal, Signal } from '@angular/core';

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
  private readonly _state = signal<ServerBusyInfo | null>(null);

  readonly state: Signal<ServerBusyInfo | null> = this._state.asReadonly();
  readonly isBusy: Signal<boolean> = computed(() => this._state() !== null);

  set(info: ServerBusyInfo): void {
    this._state.set(info);
  }

  clear(): void {
    if (this._state() !== null) this._state.set(null);
  }
}
