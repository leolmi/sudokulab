import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {SudokuFacade, SudokuInfo, TRY_NUMBER_ALGORITHM} from '@sudokulab/model';
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
  useTry$: Observable<string>;
  difficulty$: Observable<string>;
  difficultyValue$: Observable<number>;

  constructor(private _sudoku: SudokuFacade) {
    this._destroy$ = new Subject<boolean>();
    this.info$ = _sudoku.selectActiveSudoku$.pipe(
      takeUntil(this._destroy$),
      map(s => s?.sudoku?.info));

    this.difficulty$ = this.info$.pipe(map(info => info?.difficulty||'unknown'));
    this.difficultyValue$ = this.info$.pipe(map(info => info?.difficultyValue||0));
    this.useTry$ = this.info$.pipe(map(info => info?.useTryAlgorithm ? `true (${info.difficultyMap[TRY_NUMBER_ALGORITHM]})` : 'false'));
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
