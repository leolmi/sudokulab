import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HandleImageResult, Sudoku } from '@sudokulab/model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'sudokulab-schema-check',
  templateUrl: './schema-check.component.html',
  styleUrls: ['./schema-check.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaCheckComponent {
  schema$: BehaviorSubject<Sudoku>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: HandleImageResult,
              private _dialogRef: MatDialogRef<SchemaCheckComponent>) {
    this.schema$ = new BehaviorSubject<Sudoku>(data.sdk||new Sudoku());
  }

  updateSchema(sdk: Sudoku) {
    this.schema$.next(sdk);
  }

  done() {
    this._dialogRef.close(new HandleImageResult({
      sdk: this.schema$.getValue(),
      onlyValues: this.data.onlyValues
    }));
  }
}
