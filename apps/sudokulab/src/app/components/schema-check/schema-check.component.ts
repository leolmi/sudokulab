import {ChangeDetectionStrategy, Component, Inject, OnDestroy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BoardDataManager, HandleImageResult} from '@sudokulab/model';

@Component({
  selector: 'sudokulab-schema-check',
  templateUrl: './schema-check.component.html',
  styleUrls: ['./schema-check.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaCheckComponent implements OnDestroy {
  manager: BoardDataManager;

  constructor(@Inject(MAT_DIALOG_DATA) public data: HandleImageResult,
              private _dialogRef: MatDialogRef<SchemaCheckComponent>) {
    this.manager = new BoardDataManager();
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
