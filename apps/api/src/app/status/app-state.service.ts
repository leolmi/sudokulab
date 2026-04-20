import { Injectable } from '@nestjs/common';

/**
 * Stato operativo del server. `busy` implica che c'è un task pesante
 * (es. `checkAll`) che rende momentaneamente incoerente o indisponibile
 * il catalogo. Il guard globale risponde 503 alle richieste ai endpoint
 * non-whitelisted quando `busy === true`; il client può pollare lo stato
 * via `GET /api/status` per capire quando riprendere.
 */
export interface AppState {
  state: 'idle' | 'busy';
  task?: string;
  /** Intero tra 0 e 100, o undefined se il task non riporta progresso. */
  progress?: number;
  /** Timestamp ms di inizio del task (solo durante `busy`). */
  startedAt?: number;
  /** Millisecondi trascorsi dall'inizio del task (solo durante `busy`). */
  elapsedMs?: number;
}

@Injectable()
export class AppStateService {
  private busy = false;
  private task?: string;
  private progress?: number;
  private startedAt?: number;

  isBusy(): boolean {
    return this.busy;
  }

  getState(): AppState {
    if (!this.busy) return { state: 'idle' };
    return {
      state: 'busy',
      task: this.task,
      progress: this.progress,
      startedAt: this.startedAt,
      elapsedMs: this.startedAt ? Date.now() - this.startedAt : undefined,
    };
  }

  /**
   * Imposta il progresso del task in corso (0..100). Ignorato se non siamo busy.
   */
  setProgress(value: number): void {
    if (!this.busy) return;
    this.progress = Math.max(0, Math.min(100, Math.round(value)));
  }

  /**
   * Wrappa un task asincrono segnando `busy` all'inizio e `idle` al termine,
   * indipendentemente dall'esito. Se un task è già in corso, il nuovo task
   * viene eseguito lo stesso ma non sovrascrive lo stato (per non creare
   * stati incoerenti); in un sistema single-instance normalmente non capita.
   */
  async withBusy<T>(task: string, fn: () => Promise<T>): Promise<T> {
    const wasBusy = this.busy;
    if (!wasBusy) {
      this.busy = true;
      this.task = task;
      this.progress = undefined;
      this.startedAt = Date.now();
    }
    try {
      return await fn();
    } finally {
      if (!wasBusy) {
        this.busy = false;
        this.task = undefined;
        this.progress = undefined;
        this.startedAt = undefined;
      }
    }
  }
}
