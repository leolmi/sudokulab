import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { GeneratorBaseComponent } from '../../components/GeneratorBaseComponent';
import { GeneratorFacade, SudokuFacade } from '@sudokulab/model';
import { UploadDialogComponent } from '../../components/upload-dialog/upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'sudokulab-generator-page',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorComponent extends GeneratorBaseComponent implements OnDestroy {
  constructor(private _generator: GeneratorFacade,
              private _sudoku: SudokuFacade,
              private _dialog: MatDialog) {
    super(_generator);
    _sudoku
      .onUpload(UploadDialogComponent, this._destroy$)
      .subscribe(sdk => !!sdk ? _generator.loadGeneratorSchema(sdk) : null);
  }
}
