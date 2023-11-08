import {BoardData} from "./lib/tokens";
import {filter, take, takeUntil, withLatestFrom} from "rxjs/operators";
import {Subject} from "rxjs";
import {getSudoku} from "./generator.helper";
import {Sudoku} from "./lib/Sudoku";
import {BoardAction, BoardWorkerData} from "./lib/board.model";
import {extend as _extend, isEmpty as _isEmpty} from 'lodash';
import {dowloadSchema} from "./sudoku.helper";
import {getUserData, saveUserData} from "./lib/userdata";
import * as equal from "fast-deep-equal";
import {PlaySudokuOptions} from "./lib/PlaySudokuOptions";
import {handleKeyEvent, updateSchema} from "./manager.helper";
import {DataManagerBase} from "./data-manager.base";


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
export class BoardDataManager extends DataManagerBase {
  private _options: BoardDataManagerOptions;
  data: BoardData;

  constructor(data?: BoardData, o?: Partial<BoardDataManagerOptions>) {
    super(data);
    this._options = new BoardDataManagerOptions(o);
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
   * aggiorna le opzioni dello schema
   * @param o
   */
  setOptions(o: Partial<PlaySudokuOptions>) {
    if (this.data.disabled$.value) return;
    updateSchema(this.data, (sdk) => !!_extend(sdk.options, o))
      .then(() => this.changed$.next());
  }
}

