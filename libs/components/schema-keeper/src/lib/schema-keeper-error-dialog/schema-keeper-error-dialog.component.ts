import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexModule } from '@angular/flex-layout';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

export type SchemaKeeperErrorAction = 'close' | 'edit' | 'download';

export interface SchemaKeeperErrorData {
  /** La stringa values che ha provocato l'errore. */
  values: string;
  /** Informazioni sull'errore provenienti dal server / store. */
  error: {
    code: string;
    message: string;
    solutionCount?: number;
    httpStatus?: number;
  };
}

const HUMAN_ERROR_LABELS: Record<string, { title: string; hint: string }> = {
  'not-unique': {
    title: 'Lo schema ammette più di una soluzione',
    hint: 'Uno schema valido deve avere esattamente una soluzione. Modifica i valori o aggiungi qualche cella fissa per vincolarlo.',
  },
  'invalid': {
    title: 'Lo schema è incoerente',
    hint: 'Le regole base del sudoku risultano violate (es. valore duplicato in riga, colonna o box). Correggi i valori errati.',
  },
  'disagreement': {
    title: 'Lo schema non può essere risolto dal motore corrente',
    hint: 'Il brute-force conferma che c\'è una soluzione, ma il motore catalogato non la trova. Potrebbe essere un caso limite: contatta lo sviluppatore o scarica la stringa per investigare.',
  },
  'engine-error': {
    title: 'Errore interno durante il calcolo',
    hint: 'Il motore ha generato un\'eccezione imprevista. Scarica la stringa e segnala il caso.',
  },
  'persist-error': {
    title: 'Salvataggio del catalogo fallito',
    hint: 'Il motore ha risolto lo schema ma non è riuscito a scriverlo sul DB. Riprova tra qualche istante.',
  },
  'unknown-error': {
    title: 'Errore non identificato',
    hint: 'Il server ha risposto con un errore non riconosciuto. Scarica la stringa per diagnosticarla manualmente.',
  },
  'client-error': {
    title: 'Errore lato client',
    hint: 'La richiesta non è partita correttamente (problema di rete o di configurazione).',
  },
};

@Component({
  selector: 'schema-keeper-error-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FlexModule,
    MatDialogModule,
    MatButtonModule,
    MatIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="header-icon">error_outline</mat-icon>
      {{ label.title }}
    </h2>
    <mat-dialog-content>
      <div class="error-message">{{ data.error.message }}</div>
      @if (data.error.solutionCount && data.error.solutionCount >= 2) {
        <div class="error-detail">Soluzioni distinte trovate: <strong>{{ data.error.solutionCount }}{{ data.error.solutionCount >= 2 ? '+' : '' }}</strong></div>
      }
      <div class="error-hint">{{ label.hint }}</div>
      <div class="error-values">
        <div class="error-values-label">Valori dello schema:</div>
        <code class="error-values-string">{{ data.values }}</code>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions fxLayout="row" fxLayoutAlign="end center" fxLayoutGap="8px">
      <button mat-button [mat-dialog-close]="'download'">
        <mat-icon>download</mat-icon>
        Scarica stringa
      </button>
      <button mat-button [mat-dialog-close]="'edit'">
        <mat-icon>edit</mat-icon>
        Modifica schema
      </button>
      <button mat-raised-button color="primary" [mat-dialog-close]="'close'">
        Chiudi
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .header-icon {
      color: var(--mat-sys-error, #d32f2f);
    }
    .error-message {
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .error-detail {
      font-size: 13px;
      opacity: 0.85;
      margin-bottom: 8px;
    }
    .error-hint {
      font-size: 13px;
      opacity: 0.75;
      margin-bottom: 16px;
    }
    .error-values-label {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 4px;
    }
    .error-values-string {
      display: block;
      padding: 8px;
      background: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      word-break: break-all;
      line-height: 1.5;
    }
  `]
})
export class SchemaKeeperErrorDialogComponent {
  readonly data: SchemaKeeperErrorData = inject(MAT_DIALOG_DATA);
  private readonly _ref = inject(MatDialogRef<SchemaKeeperErrorDialogComponent, SchemaKeeperErrorAction>);

  get label() {
    return HUMAN_ERROR_LABELS[this.data.error.code] || HUMAN_ERROR_LABELS['unknown-error'];
  }
}
