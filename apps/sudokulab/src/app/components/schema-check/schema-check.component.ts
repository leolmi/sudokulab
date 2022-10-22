import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Cell,
  consolidate,
  getHash,
  getSudokuCells,
  HandleImageResult,
  Sudoku,
  updateSudokuCellValue
} from '@sudokulab/model';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dictionary } from '@ngrx/entity';
import { map } from 'rxjs/operators';
import { cloneDeep as _clone } from 'lodash';

@Component({
  selector: 'sudokulab-schema-check',
  templateUrl: './schema-check.component.html',
  styleUrls: ['./schema-check.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaCheckComponent {
  schema$: BehaviorSubject<Sudoku>;
  activeCellId$: BehaviorSubject<string>;
  cells$: Observable<Dictionary<Cell>>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: HandleImageResult,
              private _dialogRef: MatDialogRef<SchemaCheckComponent>) {
    this.schema$ = new BehaviorSubject<Sudoku>(data.sdk||new Sudoku());
    this.activeCellId$ = new BehaviorSubject<string>('');
    this.cells$ = this.schema$.pipe(map(sdk => getSudokuCells(sdk)));
  }

  selectionChanged(id: string) {
    this.activeCellId$.next(id);
  }

  updateSchema(sdk: Sudoku) {
    this.schema$.next(sdk);
  }

  done() {
    const sdk = new Sudoku(this.schema$.value);
    this._dialogRef.close(new HandleImageResult({sdk, onlyValues: this.data.onlyValues}));
  }

  keyPressed(value: string) {
    const id = this.activeCellId$.getValue();
    if (!!id) updateSudokuCellValue(this.schema$, { id, value });
  }
}
