import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {LabFacade, SudokuFacade, SudokuInfo, TRY_NUMBER_ALGORITHM} from '@sudokulab/model';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { keys as _keys } from 'lodash';
import {DestroyComponent} from "../DestroyComponent";

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
  difficultyValue$: Observable<number>;
  difficultyMap$: Observable<MapItem[]>;

  constructor(private _lab: LabFacade) {
    super();
    const sdk$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.info$ = sdk$.pipe(map(s => s?.sudoku?.info));
    this.percent$ = sdk$.pipe(map(s => `${(s?.state?.percent||0).toFixed(0)}%`));

    this.difficulty$ = this.info$.pipe(map(info => info?.difficulty||'unknown'));
    this.difficultyValue$ = this.info$.pipe(map(info => info?.difficultyValue||0));
    this.useTry$ = this.info$.pipe(map(info => info?.useTryAlgorithm ? `true (${info.difficultyMap[TRY_NUMBER_ALGORITHM]})` : 'false'));
    this.difficultyMap$ = this.info$.pipe(map(info => _keys(info?.difficultyMap||[])
      .map(k => ({ name: k, value: (info?.difficultyMap||{})[k]||0 }))));
  }
}
