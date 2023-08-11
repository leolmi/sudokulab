import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  ViewChild
} from "@angular/core";
import {DestroyComponent} from "../DestroyComponent";
import {
  BOARD_DATA,
  BoardAction,
  BoardData,
  cellId,
  getDimension,
  getLinesGroups,
  getSchemaCellStyle,
  isDirectionKey,
  isValidValue,
  moveOnDirection,
  PlaySudoku,
  PlaySudokuCell,
  PlaySudokuOptions,
  SUDOKU_DEFAULT_RANK,
  SudokuFacade,
  toggleValue
} from "@sudokulab/model";
import {combineLatest, Observable} from "rxjs";
import {BoardWorkerArgs, BoardWorkerData} from "./board-worker.model";
import {distinctUntilChanged, map, withLatestFrom} from "rxjs/operators";
import {cloneDeep as _clone} from 'lodash';
import * as equal from "fast-deep-equal";


@Component({
  selector: 'sudokulab-board-worker',
  templateUrl: './board-worker.component.html',
  styleUrls: ['./board-worker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardWorkerComponent extends DestroyComponent implements OnDestroy {
  private readonly _worker: Worker|undefined;

  @ViewChild('schemaElement') set schemaElement(e: ElementRef|undefined) {
    this._element$.next(e);
  };

  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  cellStyle$: Observable<any>;
  showPencil$: Observable<boolean>;
  showAvailable$: Observable<boolean>;
  gridline$: Observable<{[id: number]: boolean}>;

  @Input()
  emptyText: string = 'select a schema';

  constructor(_sudoku: SudokuFacade,
              @Inject(BOARD_DATA) public board: BoardData) {
    super(_sudoku);
    if (board.isWorkerAvailable) {
      this._worker = new Worker(new URL('./board.worker', import.meta.url));
      this._worker.onmessage = (e: MessageEvent) => {
        const data = <BoardWorkerData>e.data;
        handleWorkerSdk(board, data);
        if (data.message) _sudoku.raiseMessage(data.message);
      }
    }

    this.rows$ = board.sdk$.pipe(map(s => getDimension(s?.sudoku?.rank)),
      distinctUntilChanged((d1, d2) => equal(d1, d2)));
    this.cols$ = board.sdk$.pipe(map(s => getDimension(s?.sudoku?.rank)),
      distinctUntilChanged((d1, d2) => equal(d1, d2)));
    this.cellStyle$ = combineLatest([board.sdk$, this._resize$, this._element$])
      .pipe(map(([sdk, r, ele]) =>
        getSchemaCellStyle(sdk?.sudoku?.rank || SUDOKU_DEFAULT_RANK, ele?.nativeElement?.clientWidth || 200)));
    this.gridline$ = board.sdk$.pipe(map(s => getLinesGroups(s?.sudoku?.rank)),
      distinctUntilChanged((d1, d2) => equal(d1, d2)));
    this.showPencil$ = board.sdk$.pipe(map(s => !!s?.options.usePencil),
      distinctUntilChanged());
    this.showAvailable$ = board.sdk$.pipe(map(s => !!s?.options.showAvailables),
      distinctUntilChanged((o1, o2) => equal(o1, o2)));

    // intercetta le actions
    this.board.action$.pipe(
      withLatestFrom(this.board.sdk$))
      .subscribe(([action, sdk]) => {
        if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{ action, sdk });
      });

    // intercetta i valori
    this.board.value$.pipe(
      withLatestFrom(this.board.sdk$, this.board.activeCellId$))
      .subscribe(([value, sdk, acid]) => {
        if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{ value, sdk, action: BoardAction.value, cellId: acid });
      });
  }

  private _updateSdk(handler: (sdk: PlaySudoku, cell?: PlaySudokuCell) => boolean) {
    const sdk = _clone(this.board.sdk$.value);
    const cell = sdk.cells[this.board.activeCellId$.value];
    if (handler(sdk, cell)) {
      this.board.sdk$.next(sdk);
      if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{ sdk });
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    const sdk = this.board.sdk$.value;
    if (isDirectionKey(e?.key)) {
      e.stopPropagation();
      e.preventDefault();
      const target = moveOnDirection(this.board.activeCellId$.value, sdk.sudoku, e?.key);
      this.select(target?.col || 0, target?.row || 0);
    } else {
      this._updateSdk((sdk, cell) =>
        setCellValue(cell, (e?.key||'').trim(), sdk.options));
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  select(col: number, row: number) {
    const cid = cellId(col, row);
    this.board.activeCellId$.next(cid);
  }
}

/**
 * Imposta il valore della cella
 * @param cell
 * @param value
 * @param options
 */
const setCellValue = (cell?: PlaySudokuCell, value?: string, options?: PlaySudokuOptions): boolean => {
  if (!cell || cell.fixed) return false;
  if (!isValidValue(value||'')) return false;
  if (value === 'Delete') value = '';
  if (!!options?.usePencil) {
    cell.value = '';
    cell.pencil = !value ? [] : toggleValue(cell.pencil, value);
  } else {
    cell.pencil = [];
    cell.value = (value || '').trim();
  }
  return true;
}

/**
 * gestisce le modifiche effettuate dall'worker
 * @param board
 * @param data
 */
const handleWorkerSdk = (board: BoardData, data: BoardWorkerData) => {
  const sdk = board.sdk$.value;
  if (!sdk?.id || equal(data?.sdk, sdk)) return;
  if (data.sdk) board.sdk$.next(data.sdk);
}
