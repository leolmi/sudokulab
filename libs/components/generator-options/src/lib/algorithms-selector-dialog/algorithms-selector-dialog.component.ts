import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Algorithm } from '@olmi/model';
import { I18nDirective } from '@olmi/common';

export interface AlgorithmsSelectorData {
  algorithms: Algorithm[];
  selected: string[];
}

/**
 * Dialog di selezione degli algoritmi utilizzabili dal generatore.
 * Ritorna l'array delle id selezionate, oppure `undefined` se annullato.
 */
@Component({
  selector: 'algorithms-selector-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatCheckbox,
    MatButtonModule,
    MatIcon,
    I18nDirective,
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="flex-row flex-align-between-center">
      <span appI18n>Select algorithms</span>
      <span class="alg-counter">{{ selected.size }} / {{ algorithms.length }}</span>
    </h2>
    <mat-dialog-content>
      <div class="alg-actions flex-row flex-gap-8">
        <button mat-stroked-button (click)="selectAll()">
          <mat-icon>done_all</mat-icon> <span appI18n>Select all</span>
        </button>
        <button mat-stroked-button (click)="clearAll()">
          <mat-icon>clear</mat-icon> <span appI18n>Clear</span>
        </button>
      </div>
      <div class="alg-list">
        @for (a of algorithms; track a.id) {
          <mat-checkbox
            class="alg-item"
            [checked]="isSelected(a.id)"
            (change)="toggle(a.id, $event.checked)">
            <span class="alg-name">{{ a.name }}</span>
          </mat-checkbox>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions class="flex-row flex-align-end-center flex-gap-8">
      <button mat-button [mat-dialog-close]="undefined" appI18n>Cancel</button>
      <button mat-raised-button color="primary" (click)="confirm()" appI18n>Apply</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { margin: 0; }
    .alg-counter {
      font-size: 13px;
      font-weight: 400;
      opacity: 0.7;
    }
    .alg-actions {
      padding: 8px 0 12px;
    }
    .alg-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 16px;
      min-width: 360px;
      max-height: 50vh;
      overflow-y: auto;
    }
    .alg-item {
      padding: 2px 0;
    }
    .alg-name {
      font-size: 13px;
    }
    @media (max-width: 480px) {
      .alg-list { grid-template-columns: 1fr; min-width: 240px; }
    }
  `]
})
export class AlgorithmsSelectorDialogComponent {
  private readonly _data: AlgorithmsSelectorData = inject(MAT_DIALOG_DATA);
  private readonly _ref = inject(MatDialogRef<AlgorithmsSelectorDialogComponent, string[] | undefined>);

  readonly algorithms: Algorithm[] = this._data.algorithms;
  readonly selected: Set<string> = new Set(this._data.selected || []);

  isSelected(id: string): boolean {
    return this.selected.has(id);
  }

  toggle(id: string, checked: boolean): void {
    if (checked) this.selected.add(id);
    else this.selected.delete(id);
  }

  selectAll(): void {
    this.algorithms.forEach(a => this.selected.add(a.id));
  }

  clearAll(): void {
    this.selected.clear();
  }

  confirm(): void {
    this._ref.close([...this.selected]);
  }
}
