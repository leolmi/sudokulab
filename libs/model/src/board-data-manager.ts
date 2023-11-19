import {BoardData} from "./lib/tokens";
import {debounceTime, distinctUntilChanged, filter, map, take, takeUntil, withLatestFrom} from "rxjs/operators";
import {BehaviorSubject} from "rxjs";
import {
  BoardAction,
  BoardWorkerArgs,
  BoardWorkerData,
  BoardWorkerHighlights,
  CLEAR_INFOS_ACTION
} from "./lib/board.model";
import {extend as _extend, isEmpty as _isEmpty} from 'lodash';
import {downloadPlaySudoku, getLabCodeAction} from "./sudoku.helper";
import {getUserData, loadUserData, saveUserData} from "./lib/schemadata";
import * as equal from "fast-deep-equal";
import {PlaySudokuOptions} from "./lib/PlaySudokuOptions";
import {handleKeyEvent, updateSchema} from "./manager.helper";
import {DataManagerBase} from "./data-manager.base";
import {NgZone} from "@angular/core";
import {SudokuLab} from "./lib/logic";
import {isEmptyHihlights} from "../../../apps/sudokulab/src/app/components/board-worker/board-worker.logic";
import {DEFAULT_MESSAGES} from "./lib/consts";


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
  private _worker: Worker|undefined;
  data: BoardData;
  highlights$: BehaviorSubject<BoardWorkerHighlights>;

  constructor(private _zone: NgZone,
              private _sudokuLab: SudokuLab,
              data?: BoardData,
              o?: Partial<BoardDataManagerOptions>) {
    super(data);
    this._options = new BoardDataManagerOptions(o);
    this.data = data || new BoardData();
    this.highlights$ = new BehaviorSubject<BoardWorkerHighlights>(BoardWorkerHighlights.empty);

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

    // chiude gli highlights
    this.highlights$
      .pipe(filter(hl => !isEmptyHihlights(hl)),
        debounceTime(5000))
      .subscribe((hl) => {
        this.highlights$.next(BoardWorkerHighlights.empty);
        this.data.info$.next(undefined);
      });

    // carica i dati utente alla modifica dello schema
    this.data.sdk$
      .pipe(distinctUntilChanged((s1,s2) => s1?.id === s2?.id))
      .subscribe(s => this.loadUserData());

    // intercetta le actions
    this.data.action$.pipe(
      withLatestFrom(this.data.sdk$))
      .subscribe(([action, sdk]) => {
        if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{action, sdk});
      });

    // intercetta le info line
    this.data.info$
      .pipe(filter(i => !!i), takeUntil(this._destroy$), withLatestFrom(this.data.sdk$))
      .subscribe(([info, sdk]) => {
        if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{ sdk, action: BoardAction.infoLine, info});
      });

    // intercetta i comandi dall'esterno
    _sudokuLab.internalCode$.pipe(
      takeUntil(this._destroy$),
      map(code => getLabCodeAction(code)),
      filter(action => !!action),
      withLatestFrom(this.data.sdk$))
      .subscribe(([action, sdk]) => {
        // tenta di eseguire l'azione sul manager
        if (this.handleAction(action)) return;
        // altrimenti delega allo worker
        if (!!action && this._worker) this._worker.postMessage(<BoardWorkerArgs>{ sdk, action });
      });

    // dopo ogni modifica elimina le info di step
    this.data.manager?.changed$
      .pipe(debounceTime(250))
      .subscribe(() => _sudokuLab.state.stepInfos$.next([]));

    this.data.sdk$.pipe(
      takeUntil(this._destroy$),
      map(sdk => sdk?.state.complete),
      distinctUntilChanged(),
      filter(c => !!c))
      .subscribe(() => this._sudokuLab.showMessage(DEFAULT_MESSAGES.solved));
  }

  /**
   * inizializza la board caricando i dati utente
   */
  init(handler: () => Worker) {
    if (!this._worker) {
      this._worker = handler();
      this._worker.onmessage = (e: MessageEvent) =>
        this._zone.run(() => this.handleWorkerData(<BoardWorkerData>e.data));
    }
    this.data.userData$
      .pipe(take(1), filter(ud => _isEmpty(ud)))
      .subscribe(() => this.data.userData$.next(getUserData()));
  }

  handleWorkerData(data: BoardWorkerData) {
    this.handleWorkerSdk(data);
    if (data.message) this._sudokuLab.showMessage(data.message);
    this.highlights$.next(data.highlights || BoardWorkerHighlights.empty);
    if (data.infos) this._sudokuLab.state.stepInfos$.next(data.infos);
  }

  /**
   * gestisce gli eventi da tastiera esterni
   * @param e
   */
  handleKeyEvent(e: KeyboardEvent) {
    if (this.data.disabled$.value) return;
    const sdk = handleKeyEvent(this.data, e);
    if (sdk) this.changed();
  }

  handleAction(action?: BoardAction): boolean {
    switch (action) {
      case BoardAction.download:
        downloadPlaySudoku(this.data.sdk$.value);
        return true;
      default:
        if (CLEAR_INFOS_ACTION[action||'']) this._sudokuLab.state.stepInfos$.next([]);
        return false;
    }
  }

  /**
   * salva i dati utente
   */
  saveUserData() {
    this.data.userData$.next(saveUserData(this.data.sdk$.value));
  }

  loadUserData() {
    const sdk = loadUserData(this.data.sdk$.value);
    this.data.sdk$.next(sdk);
    if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{sdk});
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

  changed() {
    const sdk = this.data.sdk$.value;
    if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{ sdk });
    if (!sdk.options.usePencil) this._sudokuLab.state.stepInfos$.next([]);
  }
}

