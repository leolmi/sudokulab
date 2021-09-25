import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { getFixedCount, getHash, LabFacade, SudokuInfo, TRY_NUMBER_ALGORITHM } from '@sudokulab/model';
import { map, takeUntil } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { keys as _keys } from 'lodash';
import { DestroyComponent } from '../DestroyComponent';

interface MapItem {
  name: string;
  value: number;
}

@Component({
  selector: 'sudokulab-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoComponent extends DestroyComponent implements OnDestroy {
  info$: Observable<SudokuInfo|undefined>;
  percent$: Observable<string>;
  useTry$: Observable<string>;
  difficulty$: Observable<string>;
  fixed$: Observable<number>;
  hash$: Observable<string>;
  difficultyValue$: Observable<number>;
  difficultyMap$: Observable<MapItem[]>;

  constructor(private _lab: LabFacade) {
    super();
    const sdk$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.info$ = sdk$.pipe(map(s => s?.sudoku?.info));
    this.percent$ = sdk$.pipe(map(s => `${(s?.state?.percent||0).toFixed(0)}%`));
    this.fixed$ = sdk$.pipe(map(s => getFixedCount(s?.sudoku)));
    this.hash$ = sdk$.pipe(map(s => s?.sudoku?._id ? `${s.sudoku._id}` : ''));

    this.difficulty$ = this.info$.pipe(map(info => info?.difficulty||'unknown'));
    this.difficultyValue$ = this.info$.pipe(map(info => info?.difficultyValue||0));
    this.useTry$ = this.info$.pipe(map(info => info?.useTryAlgorithm ? `true (${info.difficultyMap[TRY_NUMBER_ALGORITHM]})` : 'false'));
    this.difficultyMap$ = this.info$.pipe(map(info => _keys(info?.difficultyMap||[])
      .map(k => ({ name: k, value: (info?.difficultyMap||{})[k]||0 }))));
  }
}
