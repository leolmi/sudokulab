import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {GENERATOR_DATA, GeneratorAction, GeneratorData, getSudoku, Sudoku} from '@sudokulab/model';
import {Observable} from 'rxjs';
import {map} from "rxjs/operators";

@Component({
  selector: 'sudokulab-generator-state',
  templateUrl: './generator-state.component.html',
  styleUrls: ['./generator-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorStateComponent {
  sudoku$: Observable<Sudoku>;
  constructor(@Inject(GENERATOR_DATA) public generator: GeneratorData) {
    this.sudoku$ = generator.sdk$.pipe(map(sdk => getSudoku(sdk)));
  }
  openInLab(sdk: Sudoku) {
    this.generator.schema$.next(sdk);
    this.generator.action$.next(GeneratorAction.openInLab);
  }
}
