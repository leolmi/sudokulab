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
import {distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {Dictionary} from '@ngrx/entity';
import {forEach as _forEach} from 'lodash';

@Component({
  selector: 'sudokulab-key-board',
  templateUrl: './key-board.component.html',
  styleUrls: ['./key-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyBoardComponent implements OnDestroy {
  private readonly _destroy$: Subject<void>;
  private _rank$: BehaviorSubject<number>;
  private _cells$: BehaviorSubject<Dictionary<Cell>|Cell[]>;
  isActive$: BehaviorSubject<boolean>;
  isPencil$: BehaviorSubject<boolean>;

  numbers$: Observable<string[]>;
  status$: Observable<Dictionary<boolean>>;

  @Input() set rank(n: number|undefined|null) {
    this._rank$.next(n || SUDOKU_DEFAULT_RANK);
  }
  @Input() set cells(c: Dictionary<Cell>|Cell[]|undefined|null) {
    if (!!c) this._cells$.next(c);
  }
  @Input() set isActive(a: boolean|undefined|null) {
    this.isActive$.next(!!a || this._board.isWorkerAvailable);
  }
  @Input() usePencil: boolean = false;
  @Input() set isPencil(up: boolean|undefined|null) {
    this.isPencil$.next(!!up);
  }

  @Output() onValueChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() onPencilChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(@Inject(BOARD_DATA) private _board: BoardData) {
    this._destroy$ = new Subject<void>();
    this._rank$ = new BehaviorSubject<number>(SUDOKU_DEFAULT_RANK);
    this._cells$ = new BehaviorSubject<any>({});
    this.isActive$ = new BehaviorSubject<boolean>(this._board.isWorkerAvailable);
    this.isPencil$ = new BehaviorSubject<boolean>(false);

    this.numbers$ = this._rank$.pipe(map(rank => getAvailables(rank || SUDOKU_DEFAULT_RANK).concat('x')));

    this.status$ = combineLatest([this._cells$, this._rank$, _board.sdk$]).pipe(map(([cells, rank, sdk]) => {
      const status: Dictionary<boolean> = {};
      const status_n: Dictionary<number> = {};
      const acells = _board.isWorkerAvailable ? sdk.cells : cells;
      const arank = _board.isWorkerAvailable ? sdk.sudoku?.rank||SUDOKU_DEFAULT_RANK : rank;
      _forEach(acells || [], (c: any) => {
        if (isValue(c?.value)) status_n[c.value] = (status_n[c.value] || 0) + 1;
      });
      _forEach(status_n, (v, k) => {
        status[k] = ((v || 0) >= arank);
      });
      return status;
    }));

    _board.sdk$.pipe(
      takeUntil(this._destroy$),
      distinctUntilChanged((s1,s2) => s1?.options.usePencil === s2?.options.usePencil))
      .subscribe((s) => this.isPencil$.next(!!s?.options.usePencil));
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }

  clickOnNumber(num: string) {
    if (num === 'x') num = ' ';
    if (this._board.isWorkerAvailable) return this._board.value$.next(num);
    if (this.isActive$.value) this.onValueChanged.emit(num);
  }

  togglePencil() {
    if (this._board.isWorkerAvailable) return this._board.action$.next(BoardAction.pencil);
    if (this.isActive$.value) use(this.isPencil$, pencil => this.onPencilChanged.emit(!pencil));
  }
}
