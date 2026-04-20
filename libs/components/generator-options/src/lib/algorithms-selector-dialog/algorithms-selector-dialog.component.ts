import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Algorithm } from '@olmi/model';

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
    CommonModule,
    FlexLayoutModule,
    MatDialogModule,
    MatCheckbox,
    MatButtonModule,
    MatIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title fxLayout="row" fxLayoutAlign="space-between center">
      <span>Select algorithms</span>
      <span class="alg-counter">{{ selected.size }} / {{ algorithms.length }}</span>
    </h2>
    <mat-dialog-content>
      <div class="alg-actions" fxLayout="row" fxLayoutGap="8px">
        <button mat-stroked-button (click)="selectAll()">
          <mat-icon>done_all</mat-icon> Select all
        </button>
        <button mat-stroked-button (click)="clearAll()">
          <mat-icon>clear</mat-icon> Clear
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
    <mat-dialog-actions fxLayout="row" fxLayoutAlign="end center" fxLayoutGap="8px">
      <button mat-button [mat-dialog-close]="undefined">Cancel</button>
      <button mat-raised-button color="primary" (click)="confirm()">Apply</button>
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
