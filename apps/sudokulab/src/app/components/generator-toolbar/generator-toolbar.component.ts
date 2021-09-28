import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { GeneratorBaseComponent } from '../GeneratorBaseComponent';
import { EditSudoku, GeneratorFacade, getFixedCount, Sudoku, SudokuFacade } from '@sudokulab/model';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'sudokulab-generator-toolbar',
  templateUrl: './generator-toolbar.component.html',
  styleUrls: ['./generator-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorToolbarComponent extends GeneratorBaseComponent implements OnDestroy {
  description$: Observable<string>;
  constructor(private _generator: GeneratorFacade,
              _sudoku: SudokuFacade) {
    super(_generator, _sudoku);
    this.description$ = _generator.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map((s) => `${getFixedCount(s)} fixed cells`));
  }

  run() {
    this._generator.run();
  }
  stop() {
    this._generator.stop();
  }
}
