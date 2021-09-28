import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { GeneratorBaseComponent } from '../GeneratorBaseComponent';
import { GeneratorFacade, Sudoku, SudokuFacade } from '@sudokulab/model';
import { Observable } from 'rxjs';

@Component({
  selector: 'sudokulab-generator-state',
  templateUrl: './generator-state.component.html',
  styleUrls: ['./generator-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorStateComponent extends GeneratorBaseComponent implements OnDestroy {
  schemas$: Observable<Sudoku[]>;
  constructor(private _generator: GeneratorFacade,
              _sudoku: SudokuFacade) {
    super(_generator, _sudoku);
    this.schemas$ = _generator.selectGeneratorSchemas$;
  }
  openInLab(sdk: Sudoku) {
    this._generator.openInLab(sdk);
  }
}
