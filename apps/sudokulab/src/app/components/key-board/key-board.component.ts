import {ChangeDetectionStrategy, Component, Input, OnDestroy} from '@angular/core';
import {
  BoardAction,
  GeneratorAction,
  GeneratorData,
  getAvailables,
  isValue,
  SUDOKU_DEFAULT_RANK,
  SudokuData,
  use
} from '@sudokulab/model';
import {distinctUntilChanged, filter, map, switchMap, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {Dictionary} from '@ngrx/entity';
import {forEach as _forEach, reduce as _reduce} from 'lodash';

@Component({
  selector: 'sudokulab-key-board',
  templateUrl: './key-board.component.html',
  styleUrls: ['./key-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyBoardComponent implements OnDestroy {
  private readonly _destroy$: Subject<void>;
  isPencil$: BehaviorSubject<boolean>;
  private _data$: BehaviorSubject<SudokuData<any>>;

  numbers$: Observable<string[]>;
  status$: Observable<Dictionary<boolean>>;
  playState$: Observable<string>;
  usedStatus$: Observable<Dictionary<boolean>>;
  iconX$: Observable<string>;

  @Input()
  set sudokuData(sd: SudokuData<any>) {
    this._data$.next(sd);
  }

  @Input() usePlay: boolean = false;

  @Input() usePencil = false;

  constructor() {
    this._destroy$ = new Subject<void>();
    this._data$ = new BehaviorSubject<SudokuData<any>>(new SudokuData());
    this.isPencil$ = new BehaviorSubject<boolean>(false);

    this.numbers$ = this._data$.pipe(
      takeUntil(this._destroy$),
      switchMap((data) => data.sdk$.pipe(
        takeUntil(this._destroy$),
        map((sdk) => getAvailables(sdk?.sudoku?.rank || SUDOKU_DEFAULT_RANK).concat('x')))));

    this.status$ = this._data$.pipe(
      takeUntil(this._destroy$),
      switchMap((data) => data.sdk$.pipe(
        takeUntil(this._destroy$),
        map((sdk) => {
          const status: Dictionary<boolean> = {};
          const status_n: Dictionary<number> = {};
          const rank = sdk.sudoku?.rank || SUDOKU_DEFAULT_RANK;
          _forEach(sdk?.cells || [], (c: any) => {
            if (isValue(c?.value)) status_n[c.value] = (status_n[c.value] || 0) + 1;
          });
          _forEach(status_n, (v, k) => {
            status[k] = ((v || 0) >= rank);
          });
          return status;
        }))));

    this.usedStatus$ = this._data$.pipe(
      takeUntil(this._destroy$),
      switchMap((data) => combineLatest([data.sdk$, data.activeCellId$]).pipe(
        filter(() => data.isWorkerAvailable),
        map(([sdk, cellId]) => _reduce(sdk.cells[cellId]?.pencil||[], (s, v) =>
          ({ ...s, [v]: true }), {})))));

    this.playState$ = this._data$.pipe(
      takeUntil(this._destroy$),
      filter((data) => !!(<GeneratorData>data).userStopping$ && !!(<GeneratorData>data).running$),
      switchMap((data) => combineLatest([(<GeneratorData>data).userStopping$, (<GeneratorData>data).running$]).pipe(
        map(([stopping, running]) => stopping ? 'stopping' : (running ? 'stop' : 'play')))));

    this.iconX$ = this._data$.pipe(
      takeUntil(this._destroy$),
      switchMap((data) => data.sdk$.pipe(
        takeUntil(this._destroy$),
        distinctUntilChanged((s1,s2) => s1?.options.acceptX === s2?.options.acceptX),
        map((sdk) => sdk?.options?.acceptX ? 'photo_filter' : 'check_box_outline_blank'))))

    this._data$.pipe(
      takeUntil(this._destroy$),
      switchMap((data) => data.sdk$.pipe(
        takeUntil(this._destroy$),
        distinctUntilChanged((s1,s2) => s1?.options.usePencil === s2?.options.usePencil))))
      .subscribe((s) => this.isPencil$.next(!!s?.options.usePencil));
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }

  clickOnNumber(num: string) {
    if (num === 'x') num = ' ';
    use(this._data$, data => data.value$.next(num));
  }

  togglePencil() {
    if (!this.usePencil) return;
    use(this._data$, data => data.action$.next(BoardAction.pencil));
  }

  play() {
    use(this._data$, data => data.action$.next(GeneratorAction.run));
  }
  stop() {
    use(this._data$, data => data.action$.next(GeneratorAction.stop));
  }
}
