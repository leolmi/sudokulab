import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { LabFacade, SudokuFacade } from '@sudokulab/model';
import { DestroyComponent } from '../../components/DestroyComponent';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialogComponent } from '../../components/upload-dialog/upload-dialog.component';

@Component({
  selector: 'sudokulab-lab-page',
  templateUrl: './lab.component.html',
  styleUrls: ['./lab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabComponent extends DestroyComponent implements OnDestroy {
  constructor(private _lab: LabFacade,
              private _sudoku: SudokuFacade,
              private _dialog: MatDialog) {
    super();
    _sudoku
      .onUpload(UploadDialogComponent, this._destroy$)
      .subscribe(sdk => !!sdk ? _lab.loadSudoku(sdk) : null);
  }
}
