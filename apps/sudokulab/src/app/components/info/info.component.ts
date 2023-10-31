import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {getAlgorithms, getDiffCount, getFixedCount, getTryCount, SudokuInfo, SudokuLab} from '@sudokulab/model';
import {map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {keys as _keys} from 'lodash';
import {DestroyComponent} from '../DestroyComponent';

interface MapItem {
  name: string;
  value: number;
  icon: string;
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
  useTry$: Observable<number>;
  difficulty$: Observable<string>;
  fixed$: Observable<number>;
  hash$: Observable<string>;
  difficultyValue$: Observable<number>;
  difficultyMap$: Observable<MapItem[]>;

  constructor(public sudokuLab: SudokuLab) {
    super(sudokuLab);
    this.info$ = sudokuLab.state.activePlaySudoku$.pipe(map(s => s?.sudoku?.info));
    this.percent$ = sudokuLab.state.activePlaySudoku$.pipe(map(s => `${(s?.state?.percent||0).toFixed(0)}%`));
    this.fixed$ = sudokuLab.state.activePlaySudoku$.pipe(map(s => getFixedCount(s?.sudoku)));
    this.hash$ = sudokuLab.state.activePlaySudoku$.pipe(map(s => s?.sudoku?._id ? `${s.sudoku._id}` : ''));
    this.useTry$ = sudokuLab.state.activePlaySudoku$.pipe(map(s => getTryCount(s)));

    this.difficulty$ = this.info$.pipe(map(info => info?.difficulty||'unknown'));
    this.difficultyValue$ = this.info$.pipe(map(info => info?.difficultyValue||0));
    const algorithms = getAlgorithms();
    this.difficultyMap$ = this.info$.pipe(map(info => _keys(info?.difficultyMap||{})
      .map(k => {
        const alg = algorithms.find(a => a.id === k);
        return {
          name: alg?.name || k,
          value: getDiffCount(info?.difficultyMap || {}, k),
          icon: alg?.icon || ''
        }
      })));
  }
}
