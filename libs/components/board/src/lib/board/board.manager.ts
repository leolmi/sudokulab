import { Signal } from '@angular/core';
import { outputToObservable, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { cloneDeep as _clone, isBoolean as _isBoolean, isString, last as _last } from 'lodash';
import {
  AlgorithmResult,
  applySudokuRules,
  ApplySudokuRulesOptions,
  Dictionary,
  GenerationStat,
  GeneratorOptions,
  getCellsSchema,
  getStat,
  handleUpdate,
  Highlights,
  isNumberCellValue,
  LogicOperation,
  LogicWorkerData,
  NotificationType,
  Sudoku,
  SudokuEx,
  SudokuInfoEx,
  SudokuStat,
  update,
  ValueOptions,
} from '@olmi/model';
import { AppUserOptions, Notifier, SudokuState } from '@olmi/common';
import { clearCell } from '@olmi/logic';
import { BoardComponent } from './board.component';
import { BoardCell, BoardChangeEvent, BoardStatus } from './board.model';
import { buildSchemaBoard, getBoardCells, getSequence } from './board.helper';
import { handleBoardValue } from './board-component.helper';

/**
 * Gestore dello schema (board manager).
 *
 * API ibrida (Fase 4 del refactor a Signal):
 *  - i `xxx$: BehaviorSubject<T>` restano come sorgente di verità interna e
 *    come API di compat per i consumer ancora basati su `.subscribe()` /
 *    `.value` / `.next()`;
 *  - per ogni `xxx$` è esposto anche un signal `xxx: Signal<T>` (via
 *    `toSignal(xxx$)`) per consumer signal-first; verrà promosso a sorgente
 *    di verità in una fase successiva.
 *
 * Il BoardManager viene istanziato dal `BoardComponent` dentro un
 * `runInInjectionContext(injector, () => new BoardManager(...))`, così i
 * `toSignal()` dei field initializer trovano un injection context valido.
 */
export class BoardManager {
  private readonly _board: BoardComponent;
  private readonly _destroy$ = new Subject<void>();
  private readonly _highlights$ = new BehaviorSubject<Highlights | string | undefined | null>(undefined);
  private _debounce = 200;

  // BehaviorSubject (sorgente di verità + compat API)
  readonly generatorOptions$ = new BehaviorSubject<GeneratorOptions>(new GeneratorOptions());
  readonly status$ = new BehaviorSubject<BoardStatus>(new BoardStatus());
  readonly stat$ = new BehaviorSubject<SudokuStat>(new SudokuStat());
  readonly generationStat$ = new BehaviorSubject<GenerationStat | undefined>(undefined);
  readonly multiGenerationStat$ = new BehaviorSubject<Dictionary<GenerationStat | undefined>>({});
  readonly cells$ = new BehaviorSubject<BoardCell[]>(buildSchemaBoard());
  readonly sequence$ = new BehaviorSubject<AlgorithmResult[]>([]);
  readonly sudoku$ = new BehaviorSubject<Sudoku>(new Sudoku());
  readonly focused$ = new BehaviorSubject<boolean>(false);
  readonly isStopping$ = new BehaviorSubject<boolean>(false);
  readonly selection$ = new BehaviorSubject<BoardCell | undefined>(undefined);
  readonly lockedValue$ = new BehaviorSubject<BoardChangeEvent | undefined>(undefined);

  // signal API (alimentati dai BehaviorSubject sopra). I field initializer di
  // queste proprietà girano in injection context perché il manager viene
  // istanziato via `runInInjectionContext` dal BoardComponent.
  readonly status: Signal<BoardStatus> = toSignal(this.status$, { requireSync: true });
  readonly stat: Signal<SudokuStat> = toSignal(this.stat$, { requireSync: true });
  readonly generationStat: Signal<GenerationStat | undefined> = toSignal(this.generationStat$, { requireSync: true });
  readonly multiGenerationStat: Signal<Dictionary<GenerationStat | undefined>> = toSignal(this.multiGenerationStat$, { requireSync: true });
  readonly cells: Signal<BoardCell[]> = toSignal(this.cells$, { requireSync: true });
  readonly sequence: Signal<AlgorithmResult[]> = toSignal(this.sequence$, { requireSync: true });
  readonly sudoku: Signal<Sudoku> = toSignal(this.sudoku$, { requireSync: true });
  readonly focused: Signal<boolean> = toSignal(this.focused$, { requireSync: true });
  readonly isStopping: Signal<boolean> = toSignal(this.isStopping$, { requireSync: true });
  readonly selection: Signal<BoardCell | undefined> = toSignal(this.selection$, { requireSync: true });
  readonly lockedValue: Signal<BoardChangeEvent | undefined> = toSignal(this.lockedValue$, { requireSync: true });
  readonly generatorOptions: Signal<GeneratorOptions> = toSignal(this.generatorOptions$, { requireSync: true });

  usePersistence = false;

  constructor(private board: BoardComponent, private notifier?: Notifier) {
    this._board = board;
    this._init();
  }

  private _init() {
    if (!this._board) return;
    const logic = this._board.logic();
    if (logic) {
      // valuta il ritorno del logic-worker
      logic.completed.subscribe((data: LogicWorkerData) => {
        if (data.sudoku && !data.allowHidden) {
          const cells = getBoardCells(data.sudoku);
          this.cells$.next(cells);
        }
        this.sequence$.next(getSequence(data));
        SudokuState.setIsRunning(!!data.isRunning);
        if (!data.isRunning) this.isStopping$.next(false);
        this.generationStat$.next(data.isRunning ? data.generationStat : undefined);
        update(this.multiGenerationStat$, {
          [data.index]: data.isRunning ? data.generationStat : undefined,
        });
        this._checkHighlights(data);
        this._checkNotifies(data);
      });
    }

    this.status$.pipe(takeUntil(this._destroy$)).subscribe((s) => {
      this._board.setStatus(s);
      if (!s.isLock && !!this.lockedValue$.value)
        this.lockedValue$.next(undefined);
    });

    combineLatest([this.cells$, this.sudoku$])
      .pipe(
        takeUntil(this._destroy$),
        filter(([cells]) => (cells || []).length > 0),
      )
      .subscribe(([cells, sdk]: [BoardCell[], Sudoku]) => {
        this._board.setCells(cells);
        const stat = getStat(cells);
        if (!stat.isEmpty && sdk._id && this.usePersistence)
          AppUserOptions.setUserValues(sdk._id, stat.userValues);
        this.stat$.next(mergeStat(stat, sdk));
      });

    this._highlights$
      .pipe(takeUntil(this._destroy$), debounceTime(this._debounce))
      .subscribe((h) => this._board.setHighlights(h));

    // `boardChangeRequest` è un `output()` signal-based; per usarlo come
    // Observable lo convertiamo via `outputToObservable`
    outputToObservable(this._board.boardChangeRequest)
      .pipe(takeUntil(this._destroy$))
      .subscribe((e: BoardChangeEvent) => this.applyValue(e));
  }

  private _checkHighlights(data: LogicWorkerData) {
    switch (data.operation) {
      case 'solve':
      case 'solve-to':
      case 'solve-to-try':
      case 'clear':
        this.clearHighlights();
        break;
      default: {
        const infoex = <SudokuInfoEx>data.sudoku?.info;
        if ((infoex?.solution || []).length > 0) {
          const item = _last(infoex!.solution);
          if (item?.value)
            this._highlights$.next(new Highlights(item.highlights));
        }
      }
    }
  }

  private _checkNotifies(data: LogicWorkerData) {
    if (!this.notifier || !this.status$.value?.isNotify) return;
    switch (data.operation) {
      case 'solve':
        if (data.error) {
          this.notifier.notify(data.error, NotificationType.error);
        } else if (data.sudoku) {
          this.notifier.notify('Schema solved successfully', NotificationType.success);
        }
        break;
      default:
        if (data.error) {
          this.notifier.notify(data.error, NotificationType.error);
        }
        break;
    }
  }

  /**
   * operazioni attivabili anche senza worker
   */
  private _internalLogicExecute(operation?: LogicOperation, params?: any) {
    switch (operation) {
      case 'apply-rules':
        handleUpdate(this.cells$, (cells) => {
          applySudokuRules(cells, <ApplySudokuRulesOptions>params);
          console.log('apply-rules', cells);
          return true;
        });
        break;
      case 'clear':
        handleUpdate(this.cells$, (cells) => {
          cells.forEach((c) => clearCell(c));
          return true;
        });
        break;
    }
  }

  execOperation(operation?: LogicOperation, params?: any, setFocus = false) {
    const status = this.status$.value;
    if (operation) {
      if (operation === 'assign')
        return this.applyValue(getApplyBoardEvent(status, this.selection$.value, params));
      if (operation === 'toggle') return this.toggleOption(`${params}`);
      if (operation === 'stop') this.isStopping$.next(true);
      const logic = this._board.logic();
      if (logic) {
        logic.execute({
          sudoku: new SudokuEx({ cells: this.cells$.value }),
          operation,
          options: {
            ...this.generatorOptions$.value,
            allowDynamic: !!status.isDynamic,
            schemaMode: status.editMode === 'schema',
          },
          params,
        });
      } else {
        this._internalLogicExecute(operation, params);
      }
    }
  }

  updateGeneratorOptions(o: GeneratorOptions) {
    this.generatorOptions$.next(o);
  }

  dispose() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private get _statusValue() {
    return this.status$.value;
  }

  private _refreshStatus() {
    this.execOperation('check');
  }

  load(s: string | Sudoku) {
    const sdk = isString(s) ? new Sudoku({ values: s }) : <Sudoku>s;
    this.cells$.next([]);
    this.sudoku$.next(sdk);
    const values = this.usePersistence
      ? AppUserOptions.getUserValues(sdk._id)
      : undefined;
    this.cells$.next(getBoardCells(sdk, false, values));
    this._refreshStatus();
    this.clearHighlights();
  }

  values(s: string | null) {
    if (!s || s.length !== 81) return;
    handleUpdate(this.cells$, (cells) => {
      cells.forEach((c, i) => {
        if (!c.isFixed) {
          const cv = s.charAt(i);
          c.text = isNumberCellValue(cv) ? cv : '';
        }
      });
      return true;
    });
  }

  /**
   * Forza gli `available` delle celle indicate sovrascrivendo quanto
   * calcolato da `apply-rules`. Serve soprattutto agli esempi didattici
   * (algorithm-info) quando lo snapshot di fase non è autoconsistente.
   */
  forceAvailable(map: Dictionary<string>) {
    if (!map) return;
    handleUpdate(this.cells$, (cells) => {
      cells.forEach((c) => {
        const forced = map[c.coord];
        if (forced == null) return;
        c.available = forced.split('').filter((ch) => isNumberCellValue(ch));
      });
      return true;
    });
  }

  options(o: Partial<BoardStatus>, fixed?: Partial<BoardStatus>) {
    update(this.status$, { ...o, ...fixed });
  }

  toggleOption(pn: string) {
    const o: Partial<BoardStatus> = {};
    (<any>o)[pn] = !(<any>this.status$.value)[pn];
    update(this.status$, o);
  }

  private _handleBoardChangeEvent(e: BoardChangeEvent) {
    handleBoardValue(this.cells$, e);
    this._refreshStatus();
    this.clearHighlights();
  }

  applyValue(e: BoardChangeEvent) {
    // con isLock attivo il lock "segue" l'ultima azione esplicita: qualunque valore
    // applicato (numerico, dynamic '?', empty '') sposta il lockedValue
    if (this._statusValue.isLock) this.lockedValue$.next(e);
    this._handleBoardChangeEvent(e);
  }

  switchProp(nm: keyof BoardStatus) {
    if (!_isBoolean(this._statusValue[nm])) return;
    this.options(<Partial<BoardStatus>>{ [nm]: !this._statusValue[nm] });
    this.resetFocus();
  }

  select(id: string) {
    this._board.select(id);
  }

  cycleNextMode() {
    let nextMode = this.status$.value.nextMode;
    if (nextMode === 'none') {
      nextMode = 'next-in-row';
    } else if (nextMode === 'next-in-row') {
      nextMode = 'next-in-square';
    } else {
      nextMode = 'none';
    }
    this.options(<Partial<BoardStatus>>{ nextMode });
    this.resetFocus();
  }

  resetFocus(timeout = 0) {
    setTimeout(() => this._board.focus(), timeout);
  }

  switchMode() {
    this.options({
      editMode: this._statusValue.editMode === 'play' ? 'schema' : 'play',
    });
    this.resetFocus();
  }

  switchValues() {
    this.options({
      valuesMode: this._statusValue.valuesMode === 'numbers' ? 'dots' : 'numbers',
    });
    this.resetFocus();
  }

  clearHighlights() {
    this._highlights$.next('');
  }

  setHighlights(h?: Highlights | string | undefined | null, debounce = 500) {
    this._debounce = debounce;
    this._highlights$.next(h);
  }

  clear() {
    this.execOperation('clear');
    this.clearHighlights();
  }

  goToStep(stepS: string) {
    const step = parseInt(stepS, 10);
    if (step > 0) this.execOperation('solve-to', { step });
  }

  getSchema(o?: ValueOptions) {
    return getCellsSchema(this.cells$.value, o);
  }

  applyStep(r: AlgorithmResult) {
    if (!r || !r.cellsSnapshot) return;
    this.cells$.next(r.cellsSnapshot.map((c) => new BoardCell(c)));
  }

  checkLockedValue(cell: BoardCell | undefined) {
    const lockedValue = this.lockedValue$.value;
    if (!!cell && this._statusValue.isLock && !!lockedValue) {
      const e = _clone(lockedValue);
      if (cell.text) e.value = '';
      e.cell = cell;
      this._handleBoardChangeEvent(e);
    }
  }
}

/**
 * alcune informazioni sono caricate dallo schema originale
 */
const mergeStat = (statCells: SudokuStat, sdk: Sudoku): SudokuStat => {
  return new SudokuStat({
    ...statCells,
    rank: sdk.info.rank,
    tryAlgorithmCount: sdk.info.tryAlgorithmCount,
    useTryAlgorithm: sdk.info.useTryAlgorithm,
    unique: sdk.info.unique,
    origin: sdk.info.origin,
    difficulty: sdk.info.difficulty,
    difficultyMap: sdk.info.difficultyMap,
    difficultyValue: sdk.info.difficultyValue,
    solution: (<SudokuInfoEx>sdk.info)?.solution,
  });
}

const getApplyBoardEvent = (status: BoardStatus, cell: BoardCell | undefined, value: any): BoardChangeEvent => {
  return new BoardChangeEvent({
    cell,
    status: { ...status, isCtrl: false },
    value: `${value || ''}`,
  });
}
