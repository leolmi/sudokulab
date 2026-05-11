import { ChangeDetectionStrategy, Component, inject, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getAlgorithm } from '@olmi/algorithms';
import { Algorithm } from '@olmi/model';
import { loadAlgorithmInfoPage } from '../algorithm-info-registry';
import { TranslateService } from '@olmi/common';

export interface AlgorithmInfoDialogData {
  algorithmId: string;
}

/**
 * Shell del dialog che descrive un algoritmo: header con icona+nome+sottotitolo,
 * corpo che renderizza la pagina specifica caricata lazy dal registry.
 *
 * Se non esiste una pagina curata → mostra il fallback con `title`/`description`
 * presi dal catalogo `@olmi/algorithms` e un hint "Pagina di dettaglio non ancora disponibile".
 *
 * Layout responsive: su viewport stretto (max-width 720px) il dialog diventa
 * a pagina intera senza border-radius, per sembrare una pagina dell'app.
 */
@Component({
  selector: 'algorithm-info-dialog',
  standalone: true,
  imports: [
    NgComponentOutlet,
    MatDialogModule,
    MatButtonModule,
    MatIcon,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alg-info-root flex-col">
      <div class="alg-info-header flex-row flex-align-start-center flex-gap-12">
        @let alg = algorithm;
        @if (alg) {
          <mat-icon class="alg-info-icon">{{ alg.icon }}</mat-icon>
          <div class="flex-col flex-1">
            <div class="alg-info-name">{{ alg.name }}</div>
            <div class="alg-info-subtitle">{{ tr.t(alg.title) }}</div>
          </div>
        } @else {
          <div class="alg-info-name flex-1">{{ tr.t('Unknown algorithm') }} ({{ data.algorithmId }})</div>
        }
        <button mat-icon-button [mat-dialog-close]="null" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="alg-info-body flex-1">
        @let cmp = pageComponent();
        @if (loading()) {
          <div class="alg-info-loading flex-row flex-align-center-center">
            <mat-spinner diameter="36"></mat-spinner>
          </div>
        } @else if (cmp) {
          <ng-container *ngComponentOutlet="cmp"></ng-container>
        } @else {
          <div class="alg-info-fallback">
            @if (alg) {
              <p class="alg-info-description">{{ tr.t(alg.description) }}</p>
              @if (alg.factor) {
                <p class="alg-info-factor">
                  <strong>{{ tr.t('Difficulty factor:') }}</strong> <code>{{ alg.factor }}</code>
                </p>
              }
              <p class="alg-info-missing">
                <em>{{ tr.t('Detail page not yet available for this algorithm.') }}</em>
              </p>
            } @else {
              <p>{{ tr.t('No information available.') }}</p>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .alg-info-root {
      min-width: 320px;
      min-height: 200px;
      max-width: 100%;
      height: 100%;
    }
    .alg-info-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .alg-info-icon { font-size: 28px; width: 28px; height: 28px; opacity: 0.85; }
    .alg-info-name { font-size: 18px; font-weight: 600; line-height: 1.25; }
    .alg-info-subtitle { font-size: 13px; opacity: 0.7; line-height: 1.35; margin-top: 2px; }
    .alg-info-body {
      padding: 20px;
      overflow: auto;
    }
    .alg-info-loading { padding: 40px; }
    .alg-info-fallback {
      max-width: 720px;
    }
    .alg-info-description { font-size: 14px; line-height: 1.5; }
    .alg-info-factor { font-size: 13px; opacity: 0.85; }
    .alg-info-factor code {
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .alg-info-missing { font-size: 13px; opacity: 0.6; margin-top: 16px; }
  `],
})
export class AlgorithmInfoDialogComponent {
  protected readonly data: AlgorithmInfoDialogData = inject(MAT_DIALOG_DATA);
  protected readonly tr = inject(TranslateService);

  protected readonly algorithm: Algorithm | undefined = getAlgorithm(this.data.algorithmId);
  protected readonly loading = signal<boolean>(false);
  protected readonly pageComponent = signal<Type<unknown> | null>(null);

  constructor() {
    const loader = loadAlgorithmInfoPage(this.data.algorithmId);
    if (!loader) return;
    this.loading.set(true);
    loader
      .then(cmp => this.pageComponent.set(cmp))
      .catch(err => console.error('Failed to load algorithm info page', err))
      .finally(() => this.loading.set(false));
  }
}

/**
 * Configurazione comune per aprire il dialog: responsive a pagina intera
 * su viewport stretti tramite una classe CSS applicata al pannello.
 */
export const ALGORITHM_INFO_DIALOG_CONFIG = {
  autoFocus: false,
  maxWidth: '900px',
  width: '90vw',
  height: '80vh',
  panelClass: 'algorithm-info-dialog-panel',
};
