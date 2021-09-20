import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { GeneratorBaseComponent } from '../GeneratorBaseComponent';
import { GeneratorFacade, Sudoku } from '@sudokulab/model';
import { Observable } from 'rxjs';

@Component({
  selector: 'sudokulab-generator-state',
  templateUrl: './generator-state.component.html',
  styleUrls: ['./generator-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorStateComponent extends GeneratorBaseComponent implements OnDestroy {
  schemas$: Observable<Sudoku[]>;
  constructor(private _generator: GeneratorFacade) {
    super(_generator);

    this.schemas$ = _generator.selectGeneratorSchemas$;
  }
  run() {
    this._generator.run();
  }
  stop() {
    this._generator.stop();
  }
}
