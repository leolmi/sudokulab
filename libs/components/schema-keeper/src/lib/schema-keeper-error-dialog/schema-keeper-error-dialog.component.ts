import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { I18nDirective, TranslateService } from '@olmi/common';

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
    title: 'The schema has more than one solution',
    hint: 'A valid schema must have exactly one solution. Modify the values or add some fixed cells to constrain it.',
  },
  'invalid': {
    title: 'The schema is inconsistent',
    hint: 'The basic sudoku rules are violated (e.g. duplicate value in row, column or box). Correct the wrong values.',
  },
  'disagreement': {
    title: 'The schema cannot be solved by the current engine',
    hint: 'Brute-force confirms a solution exists, but the catalogued engine cannot find it. It may be an edge case: contact the developer or download the string to investigate.',
  },
  'engine-error': {
    title: 'Internal error during computation',
    hint: 'The engine raised an unexpected exception. Download the string and report the case.',
  },
  'persist-error': {
    title: 'Catalog save failed',
    hint: 'The engine solved the schema but failed to write it to the DB. Try again in a moment.',
  },
  'unknown-error': {
    title: 'Unidentified error',
    hint: 'The server responded with an unrecognized error. Download the string to diagnose it manually.',
  },
  'client-error': {
    title: 'Client-side error',
    hint: 'The request did not start correctly (network or configuration issue).',
  },
};

@Component({
  selector: 'schema-keeper-error-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIcon,
    I18nDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="header-icon">error_outline</mat-icon>
      {{ tr.t(label.title) }}
    </h2>
    <mat-dialog-content>
      <div class="error-message">{{ data.error.message }}</div>
      @if (data.error.solutionCount && data.error.solutionCount >= 2) {
        <div class="error-detail">{{ tr.t('Distinct solutions found:') }} <strong>{{ data.error.solutionCount }}{{ data.error.solutionCount >= 2 ? '+' : '' }}</strong></div>
      }
      <div class="error-hint">{{ tr.t(label.hint) }}</div>
      <div class="error-values">
        <div class="error-values-label" appI18n>Schema values:</div>
        <code class="error-values-string">{{ data.values }}</code>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions class="flex-row flex-align-end-center flex-gap-8">
      <button mat-button [mat-dialog-close]="'download'">
        <mat-icon>download</mat-icon>
        <span appI18n>Download string</span>
      </button>
      <button mat-button [mat-dialog-close]="'edit'">
        <mat-icon>edit</mat-icon>
        <span appI18n>Edit schema</span>
      </button>
      <button mat-raised-button color="primary" [mat-dialog-close]="'close'" appI18n>
        Close
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
  readonly tr = inject(TranslateService);
  private readonly _ref = inject(MatDialogRef<SchemaKeeperErrorDialogComponent, SchemaKeeperErrorAction>);

  get label() {
    return HUMAN_ERROR_LABELS[this.data.error.code] || HUMAN_ERROR_LABELS['unknown-error'];
  }
}
