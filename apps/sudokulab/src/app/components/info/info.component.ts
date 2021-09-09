import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {getDifficulty, SudokuFacade, SudokuInfo} from '@sudokulab/model';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'sudokulab-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoComponent implements OnDestroy {
  protected readonly _destroy$: Subject<boolean>;
  info$: Observable<SudokuInfo|undefined>;
  difficulty$: Observable<string>;

  constructor(private _sudoku: SudokuFacade) {
    this._destroy$ = new Subject<boolean>();
    this.info$ = _sudoku.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?.sudoku?.info));
    this.difficulty$ = _sudoku.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => getDifficulty(s?.sudoku?.info?.algorithms || [])));
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
