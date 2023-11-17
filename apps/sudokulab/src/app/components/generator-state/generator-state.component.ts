import {ChangeDetectionStrategy, Component, Inject, OnDestroy} from '@angular/core';
import {GENERATOR_DATA, GeneratorAction, GeneratorData, getSudoku, Sudoku} from '@sudokulab/model';
import {Observable, Subject} from 'rxjs';
import {map, takeUntil} from "rxjs/operators";

@Component({
  selector: 'sudokulab-generator-state',
  templateUrl: './generator-state.component.html',
  styleUrls: ['./generator-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorStateComponent implements OnDestroy {
  private readonly _destroy$: Subject<void>;
  sudoku$: Observable<Sudoku|undefined>;

  constructor(@Inject(GENERATOR_DATA) public generator: GeneratorData) {
    this._destroy$ = new Subject<void>();
    this.sudoku$ = generator.workingSchema$.pipe(takeUntil(this._destroy$));
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }

  openInLab(sdk: Sudoku) {
    this.generator.schema$.next(sdk);
    this.generator.action$.next(GeneratorAction.openInLab);
  }
}
