import { DestroyComponent } from './DestroyComponent';
import { GeneratorFacade, SudokuFacade } from '@sudokulab/model';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export class GeneratorBaseComponent extends DestroyComponent {
  running$: Observable<boolean>;
  constructor(_generator: GeneratorFacade,
              _sudoku: SudokuFacade) {
    super(_sudoku);
    this.running$ = _generator.selectGeneratorIsRunning$.pipe(takeUntil(this._destroy$));
  }
}
