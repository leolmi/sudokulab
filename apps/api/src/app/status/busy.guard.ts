import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AppStateService } from './app-state.service';

/**
 * Percorsi sempre disponibili anche quando il server è `busy`:
 * - `/status` consente al client di pollare l'avanzamento
 * - `/info` espone info applicative statiche (versione, algoritmi)
 * - `/ocr/*` ha il suo semaforo interno e non dipende dal catalogo
 *
 * Il resto (principalmente `/sudoku/*`) riceve 503 durante un task lungo
 * per evitare letture/scritture incoerenti sul catalogo.
 */
const ALLOWED_PREFIXES = ['/api/status', '/api/info', '/api/ocr'];

const DEFAULT_RETRY_AFTER_SECONDS = 5;

@Injectable()
export class BusyGuard implements CanActivate {
  constructor(private readonly appState: AppStateService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const path = req.path || req.url || '';
    if (ALLOWED_PREFIXES.some(p => path.startsWith(p))) return true;
    if (!this.appState.isBusy()) return true;

    const state = this.appState.getState();
    throw new HttpException(
      {
        code: 'server-busy',
        message: `Il server sta eseguendo "${state.task}", riprovare tra poco.`,
        retryAfter: DEFAULT_RETRY_AFTER_SECONDS,
        task: state.task,
        progress: state.progress,
        startedAt: state.startedAt,
        elapsedMs: state.elapsedMs,
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}
