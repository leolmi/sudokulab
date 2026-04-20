import { ChangeDetectionStrategy, Component, inject, OnInit, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BehaviorSubject } from 'rxjs';
import { getAlgorithm } from '@olmi/algorithms';
import { Algorithm } from '@olmi/model';
import { loadAlgorithmInfoPage } from '../algorithm-info-registry';

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
    CommonModule,
    FlexLayoutModule,
    MatDialogModule,
    MatButtonModule,
    MatIcon,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alg-info-root" fxLayout="column">
      <div class="alg-info-header" fxLayout="row" fxLayoutAlign="start center" fxLayoutGap="12px">
        @if (algorithm) {
          <mat-icon class="alg-info-icon">{{ algorithm.icon }}</mat-icon>
          <div fxLayout="column" fxFlex>
            <div class="alg-info-name">{{ algorithm.name }}</div>
            <div class="alg-info-subtitle">{{ algorithm.title }}</div>
          </div>
        } @else {
          <div fxFlex class="alg-info-name">Algoritmo sconosciuto ({{ data.algorithmId }})</div>
        }
        <button mat-icon-button [mat-dialog-close]="null" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="alg-info-body" fxFlex>
        @let cmp = pageComponent$ | async;
        @if (loading$ | async) {
          <div class="alg-info-loading" fxLayout="row" fxLayoutAlign="center center">
            <mat-spinner diameter="36"></mat-spinner>
          </div>
        } @else if (cmp) {
          <ng-container *ngComponentOutlet="cmp"></ng-container>
        } @else {
          <div class="alg-info-fallback">
            @if (algorithm) {
              <p class="alg-info-description">{{ algorithm.description }}</p>
              @if (algorithm.factor) {
                <p class="alg-info-factor">
                  <strong>Fattore di difficoltà:</strong> <code>{{ algorithm.factor }}</code>
                </p>
              }
              <p class="alg-info-missing">
                <em>Pagina di dettaglio non ancora disponibile per questo algoritmo.</em>
              </p>
            } @else {
              <p>Nessuna informazione disponibile.</p>
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
  `]
})
export class AlgorithmInfoDialogComponent implements OnInit {
  readonly data: AlgorithmInfoDialogData = inject(MAT_DIALOG_DATA);
  private readonly _ref = inject(MatDialogRef<AlgorithmInfoDialogComponent>);

  algorithm: Algorithm | undefined;
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly pageComponent$ = new BehaviorSubject<Type<unknown> | null>(null);

  ngOnInit(): void {
    this.algorithm = getAlgorithm(this.data.algorithmId);
    const loader = loadAlgorithmInfoPage(this.data.algorithmId);
    if (!loader) return;
    this.loading$.next(true);
    loader
      .then(cmp => this.pageComponent$.next(cmp))
      .catch(err => console.error('Failed to load algorithm info page', err))
      .finally(() => this.loading$.next(false));
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
