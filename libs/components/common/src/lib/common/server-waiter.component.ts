import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServerBusyService } from './server-busy.service';

/**
 * Overlay globale che si attiva quando l'HTTP interceptor è in attesa
 * che il server torni `idle`. Mostra task corrente + progresso + elapsed.
 *
 * Uso: inserirlo una sola volta nell'`app.component.html` all'apice del
 * template — è un overlay `position: fixed` che copre lo schermo.
 */
@Component({
  selector: 'sudoku-server-waiter',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (busy.state$ | async; as s) {
      <div class="server-waiter-backdrop">
        <div class="server-waiter-card">
          <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
          <div class="server-waiter-title">Server occupato</div>
          <div class="server-waiter-task">{{ taskLabel(s.task) }}</div>
          @if (s.progress !== undefined && s.progress !== null) {
            <mat-progress-bar mode="determinate" [value]="s.progress"></mat-progress-bar>
            <div class="server-waiter-progress">{{ s.progress }}%</div>
          } @else {
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          }
          <div class="server-waiter-elapsed">In attesa da {{ formatElapsed(s.waitElapsedMs) }}</div>
        </div>
      </div>
    }
  `,
  styles: [`
    .server-waiter-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: all;
    }
    .server-waiter-card {
      min-width: 320px;
      max-width: 420px;
      padding: 24px 28px;
      background: var(--mat-sys-surface, #2b2b2b);
      color: var(--mat-sys-on-surface, #f0f0f0);
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .server-waiter-title {
      font-size: 18px;
      font-weight: 600;
    }
    .server-waiter-task {
      font-size: 14px;
      opacity: 0.85;
    }
    .server-waiter-progress {
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }
    .server-waiter-elapsed {
      font-size: 12px;
      opacity: 0.7;
    }
    mat-progress-bar {
      width: 100%;
    }
  `]
})
export class ServerWaiterComponent {
  busy = inject(ServerBusyService);

  taskLabel(task: string): string {
    switch (task) {
      case 'checkAll': return 'Verifica del catalogo in corso...';
      case 'verifyUniqueness': return 'Certificazione univocità schemi...';
      default: return task ? `Task: ${task}` : 'Elaborazione in corso...';
    }
  }

  formatElapsed(ms: number): string {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}m ${r}s`;
  }
}
