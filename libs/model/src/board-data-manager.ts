import {BoardData, SudokuData} from "./lib/tokens";
import {debounceTime, filter, take, takeUntil, withLatestFrom} from "rxjs/operators";
import {isObservable, Observable, Subject} from "rxjs";
import {PlaySudoku} from "./lib/PlaySudoku";
import {getSudoku} from "./generator.helper";
import {Sudoku} from "./lib/Sudoku";
import {BoardAction, BoardWorkerData} from "./lib/board.model";
import {cloneDeep as _clone, extend as _extend, isEmpty as _isEmpty} from 'lodash';
import {cellId, clearEvent, dowloadSchema, isDirectionKey, moveOnDirection} from "./sudoku.helper";
import {PlaySudokuCell} from "./lib/PlaySudokuCell";
import {getUserData, saveUserData} from "./lib/userdata";
import {applyCellValue, clearSchema} from "../../../apps/sudokulab/src/app/components/board-worker/board-worker.logic";
import * as equal from "fast-deep-equal";
import {PlaySudokuOptions} from "./lib/PlaySudokuOptions";


export class Chainable {
  private _completed = false;
  private _then: (() => any)|undefined = undefined;
  complete = () => this._completed = true;
  next = (timeout = 10) => {
    if (this._completed) return;
    this._completed = true;
    setTimeout(() => !!this._then ? this._then() : null, timeout);
  }
  then = (handler: () => any) => this._then = handler;
}

export class BoardDataManagerOptions {
  constructor(o?: Partial<BoardDataManagerOptions>) {
    this.skipActions = false;
    this.skipValues = false;
    this.saveDataOnChanges = false;
    Object.assign(this, o || {});
  }
  skipActions: boolean;
  skipValues: boolean;
  saveDataOnChanges: boolean;
}


/**
 * GESTORE DI BORD-DATA
 * - gestisce gli eventi da tastiera
 * - gestisce le modifiche
 */
export class BoardDataManager {
  private readonly _destroy$: Subject<void>;
  private _options: BoardDataManagerOptions;
  data: BoardData;
  changed$: Subject<void>;

  constructor(data?: BoardData, o?: Partial<BoardDataManagerOptions>) {
    this._options = new BoardDataManagerOptions(o);
    this._destroy$ = new Subject<void>();
    this.changed$ = new Subject<void>();
    this.data = data || new BoardData();

    if (!this._options.skipValues) this.data.value$
      .pipe(takeUntil(this._destroy$))
      .subscribe(key => this.handleKeyEvent(<KeyboardEvent>{key}));

    if (!this._options.skipActions) this.data.action$
      .pipe(takeUntil(this._destroy$), withLatestFrom(this.data.disabled$))
      .subscribe(([action, disabled]) =>
        disabled ? null : this.handleAction(action));

    if (this._options.saveDataOnChanges) this.changed$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.saveUserData());
  }

  dispose() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }

  /**
   * inizializza la board caricando i dati utente
   */
  init() {
    this.data.userData$
      .pipe(take(1), filter(ud => _isEmpty(ud)))
      .subscribe(() => this.data.userData$.next(getUserData()));
  }

  /**
   * gestisce gli eventi da tastiera
   * @param e
   */
  handleKeyEvent(e: KeyboardEvent) {
    if (this.data.disabled$.value) return;
    const sdk = handleKeyEvent(this.data, e);
    if (sdk) this.changed$.next();
  }

  handleAction(action?: BoardAction): boolean {
    switch (action) {
      case BoardAction.download:
        dowloadSchema(this.data.sdk$.value);
        return true;
      default:
        return false;
    }
  }

  /**
   * salva i dati utente
   */
  saveUserData() {
    this.data.userData$.next(saveUserData(this.data.sdk$.value));
  }

  /**
   * gestisce le modifiche effettuate dall'worker
   * @param data
   */
  handleWorkerSdk(data: BoardWorkerData) {
    if (this.data.disabled$.value) return;
    const sdk = this.data.sdk$.value;
    if (!sdk?.id || equal(data?.sdk, sdk)) return;
    if (data.sdk) {
      this.data.sdk$.next(data.sdk);
      this.changed$.next();
    }
  }

  /**
   * restituisce il sudoku attivo
   */
  getSudoku(): Sudoku {
    const sdk = this.data.sdk$.value;
    return getSudoku(sdk);
  }

  /**
   * aggiorna le opzioni dello schema
   * @param o
   */
  setOptions(o: Partial<PlaySudokuOptions>) {
    if (this.data.disabled$.value) return;
    updateSchema(this.data, (sdk) => !!_extend(sdk.options, o))
      .then(() => this.changed$.next());
  }
}

/**
 * gestione dello schema
 * @param chn
 * @param data
 * @param sdk
 * @param handled
 */
const handleSchemaChainable = (chn: Chainable, data: SudokuData<any>, sdk: PlaySudoku, handled: boolean) => {
  if (handled) {
    data.sdk$.next(sdk);
    chn.next();
  } else {
    chn.complete();
  }
}

/**
 * Aggiorna lo schema del BoardData
 * @param data
 * @param handler
 */
export const updateSchema = (data: SudokuData<any>, handler: (sdk: PlaySudoku, cell?: PlaySudokuCell) => boolean|Observable<boolean>): Chainable => {
  const chn = new Chainable();
  if (data.disabled$.value) {
    chn.complete();
  } else {
    const sdk = _clone(data.sdk$.value);
    const cell = sdk.cells[data.activeCellId$.value];
    const result = handler(sdk, cell);
    if (isObservable(result)) {
      result
        .pipe(take(1))
        .subscribe(r => handleSchemaChainable(chn, data, sdk, r));
    } else {
      handleSchemaChainable(chn, data, sdk, result);
    }
  }
  return chn;
}

/**
 * gestisce gli eventi da tastiera su un BoardData
 * @param data
 * @param e
 */
export const handleKeyEvent = (data: SudokuData<any>, e: KeyboardEvent): PlaySudoku|undefined => {
  if (data.disabled$.value) return undefined;
  let sdk = data.sdk$.value;
  if (isDirectionKey(e?.key)) {
    clearEvent(e);
    const target = moveOnDirection(data.activeCellId$.value, sdk.sudoku, e?.key);
    const cid = cellId(target?.col || 0, target?.row || 0);
    data.activeCellId$.next(cid);
    return undefined;
  } else {
    updateSchema(data, (sdk, cell) =>
      applyCellValue(cell, e?.key||'', sdk.options));
    return data.sdk$.value;
  }
}
