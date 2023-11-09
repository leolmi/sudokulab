import {ChangeDetectionStrategy, Component, Inject, NgZone, OnDestroy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BoardDataManager, HandleImageResult, SudokuLab} from '@sudokulab/model';

@Component({
  selector: 'sudokulab-schema-check',
  templateUrl: './schema-check.component.html',
  styleUrls: ['./schema-check.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaCheckComponent implements OnDestroy {
  manager: BoardDataManager;

  constructor(@Inject(MAT_DIALOG_DATA) public data: HandleImageResult,
              private _zone: NgZone,
              private _sudokuLab: SudokuLab,
              private _dialogRef: MatDialogRef<SchemaCheckComponent>) {
    this.manager = new BoardDataManager(_zone, _sudokuLab);
    this.manager.setOptions({fixedValues: true});
  }

  ngOnDestroy() {
    this.manager.dispose();
  }

  done() {
    const sdk = this.manager.getSudoku();
    this._dialogRef.close(new HandleImageResult({sdk, onlyValues: this.data.onlyValues}));
  }
}
