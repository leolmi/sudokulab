import {ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnDestroy, Output} from '@angular/core';
import {
  BOARD_DATA,
  BoardAction,
  BoardData,
  Cell,
  getAvailables,
  isValue,
  SUDOKU_DEFAULT_RANK,
  use
} from '@sudokulab/model';
import {distinctUntilChanged, filter, map, mergeMap, switchMap, takeUntil} from 'rxjs/operators';
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
  private _board$: BehaviorSubject<BoardData>;

  numbers$: Observable<string[]>;
  status$: Observable<Dictionary<boolean>>;
  usedStatus$: Observable<Dictionary<boolean>>;

  @Input()
  set boardData(bd: BoardData) {
    this._board$.next(bd);
  }

  @Input() usePencil: boolean = false;

  constructor() {
    this._destroy$ = new Subject<void>();
    this._board$ = new BehaviorSubject<BoardData>(new BoardData());
    this.isPencil$ = new BehaviorSubject<boolean>(false);

    this.numbers$ = this._board$.pipe(
      takeUntil(this._destroy$),
      switchMap((board) => board.sdk$.pipe(
        takeUntil(this._destroy$),
        map((sdk) => getAvailables(sdk?.sudoku?.rank || SUDOKU_DEFAULT_RANK).concat('x')))));

    this.status$ = this._board$.pipe(
      takeUntil(this._destroy$),
      switchMap((board) => board.sdk$.pipe(
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

    this.usedStatus$ = this._board$.pipe(
      takeUntil(this._destroy$),
      switchMap((board) => combineLatest([board.sdk$, board.activeCellId$]).pipe(
        filter(() => board.isWorkerAvailable),
        map(([sdk, cellId]) => _reduce(sdk.cells[cellId]?.pencil||[], (s, v) =>
          ({ ...s, [v]: true }), {})))));

    this._board$.pipe(
      takeUntil(this._destroy$),
      switchMap((board) => board.sdk$.pipe(
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
    use(this._board$, board => board.value$.next(num));
  }

  togglePencil() {
    if (!this.usePencil) return;
    use(this._board$, board => board.action$.next(BoardAction.pencil));
  }
}
