import { Observable, Subject } from 'rxjs';
import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";
import { SudokuFacade } from '@sudokulab/model';

@Component({
  selector: 'destroy-component',
  template: '<div></div>'
})
export class DestroyComponent implements OnDestroy {
  protected readonly _destroy$: Subject<boolean>;
  compact$: Observable<boolean>;
  constructor(protected _sudoku: SudokuFacade) {
    this._destroy$ = new Subject<boolean>();
    this.compact$ = _sudoku.selectIsCompact$;
  }

  checkCompact() { this._sudoku.checkCompactStatus(); }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
