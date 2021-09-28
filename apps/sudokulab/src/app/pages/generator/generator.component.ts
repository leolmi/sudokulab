import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { GeneratorBaseComponent } from '../../components/GeneratorBaseComponent';
import { GeneratorFacade, SudokuFacade } from '@sudokulab/model';
import { UploadDialogComponent } from '../../components/upload-dialog/upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'sudokulab-generator-page',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorComponent extends GeneratorBaseComponent implements OnDestroy {
  layout$: Observable<string>;
  constructor(private _generator: GeneratorFacade,
              private _dialog: MatDialog,
              _sudoku: SudokuFacade) {
    super(_generator, _sudoku);
    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    _sudoku
      .onUpload(UploadDialogComponent, this._destroy$)
      .subscribe(sdk => !!sdk ? _generator.loadGeneratorSchema(sdk) : null);
  }
}
