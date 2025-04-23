import { BehaviorSubject, combineLatest, debounceTime, filter, Subject, takeUntil } from 'rxjs';
import {
  BoardCell,
  BoardChangeEvent,
  BoardComponent,
  BoardStatus,
  buildSchemaBoard,
  getBoardCells,
  getSequence,
  handleBoardValue
} from '@olmi/board';
import { cloneDeep as _clone, isBoolean as _isBoolean, isString, last as _last } from 'lodash';
import {
  AlgorithmResult,
  Dictionary,
  GenerationStat,
  GeneratorOptions,
  getCellsSchema,
  getStat,
  Highlights,
  isValidCellValue,
  LogicOperation,
  LogicWorkerData,
  NotificationType,
  Sudoku,
  SudokuEx,
  SudokuInfoEx,
  SudokuStat,
  update,
  ValueOptions
} from '@olmi/model';
import { AppUserOptions, Notifier, SudokuState } from '@olmi/common';
import { clearCell } from '@olmi/logic';

/**
 * gestore dello schema
 * semplifica l'accesso allo schema
 */
export class BoardManager {
  private readonly _board: BoardComponent;
  private readonly _destroy$: Subject<void>;
  private readonly _highlights$: BehaviorSubject<Highlights|string|undefined|null>;
  private _debounce = 200;

  readonly generatorOptions$: BehaviorSubject<GeneratorOptions>;
  status$: BehaviorSubject<BoardStatus>;
  stat$: BehaviorSubject<SudokuStat>;
  generationStat$: BehaviorSubject<GenerationStat|undefined>;
  multiGenerationStat$: BehaviorSubject<Dictionary<GenerationStat|undefined>>;
  cells$: BehaviorSubject<BoardCell[]>;
  sequence$: BehaviorSubject<AlgorithmResult[]>;
  sudoku$: BehaviorSubject<Sudoku>;
  focused$: BehaviorSubject<boolean>;
  isStopping$: BehaviorSubject<boolean>;
  selection$: BehaviorSubject<BoardCell|undefined>;
  lockedValue$: BehaviorSubject<BoardChangeEvent|undefined>;

  usePersistence: boolean = false;

  constructor(private board: BoardComponent,
              private notifier?: Notifier) {
    this._destroy$ = new Subject<void>();
    this.focused$ = new BehaviorSubject<boolean>(false);
    this.status$ = new BehaviorSubject<BoardStatus>(new BoardStatus());
    this.sudoku$ = new BehaviorSubject<Sudoku>(new Sudoku());
    this.cells$ = new BehaviorSubject<BoardCell[]>(buildSchemaBoard());
    this.stat$ = new BehaviorSubject<SudokuStat>(new SudokuStat());
    this.isStopping$ = new BehaviorSubject<boolean>(false);
    this.selection$ = new BehaviorSubject<BoardCell|undefined>(<BoardCell|undefined>undefined);
    this.generationStat$ = new BehaviorSubject<GenerationStat|undefined>(undefined);
    this.multiGenerationStat$ = new BehaviorSubject<Dictionary<GenerationStat|undefined>>({});
    this.sequence$ = new BehaviorSubject<AlgorithmResult[]>([]);
    this.generatorOptions$ = new BehaviorSubject<GeneratorOptions>(new GeneratorOptions());
    this.lockedValue$ = new BehaviorSubject<BoardChangeEvent|undefined>(undefined);
    this._highlights$ = new BehaviorSubject<Highlights | string | undefined | null>(undefined);
    this._board = board;
    this._init();
  }

  private _init() {
    if (!this._board) return;
    if (this.board.logic) {
      // valuta il ritorno del logic-worker
      this.board.logic.completed.subscribe(data => {
        if (data.sudoku && !data.allowHidden) {
          const cells= getBoardCells(data.sudoku)
          this.cells$.next(cells);
        }
        this.sequence$.next(getSequence(data));
        SudokuState.isRunning$.next(!!data.isRunning);
        if (!data.isRunning) this.isStopping$.next(false);
        this.generationStat$.next(data.isRunning ? data.generationStat : undefined);
        update(this.multiGenerationStat$, { [data.index]: data.isRunning ? data.generationStat : undefined });
        this._checkHighlights(data);
        this._checkNotifies(data);
      });
    }

    this.status$
      .pipe(takeUntil(this._destroy$))
      .subscribe(s => {
        this._board!.status = s;
        if (!s.isLock && !!this.lockedValue$.value) this.lockedValue$.next(undefined);
      });

    combineLatest([this.cells$, this.sudoku$]).pipe(
      takeUntil(this._destroy$),
      filter(([cells, sdk]) => (cells||[]).length>0))
      .subscribe(([cells, sdk]: [BoardCell[], Sudoku]) => {
        this._board!.cells = cells;
        const stat = getStat(cells);
        if (!stat.isEmpty && sdk._id && this.usePersistence)
          AppUserOptions.setUserValues(sdk._id, stat.userValues);
        this.stat$.next(mergeStat(stat, sdk));
      });

    this._highlights$
      .pipe(takeUntil(this._destroy$), debounceTime(this._debounce))
      .subscribe(h => this._board.highlights = h);

    this._board.boardChangeRequest
      .pipe(takeUntil(this._destroy$))
      .subscribe(e => this.applyValue(e));
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
          if (item?.value) this._highlights$.next(new Highlights(item.highlights));
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

  private _updateCells(handler: (cells: BoardCell[]) => boolean) {
    const cells = _clone(this.cells$.value);
    if (handler(cells)) this.cells$.next(cells);
  }

  /**
   * operazioni attivabili anche senza worker
   * @param operation
   * @param params
   */
  private _internalLogicExecute(operation?: LogicOperation, params?: any) {
    switch (operation) {
      case 'clear':
        this._updateCells(cells => {
          cells.forEach(c => clearCell(c));
          return true;
        });
        break;
    }
  }

  execOperation(operation?: LogicOperation, params?: any, setFocus = false) {
    const status = this.status$.value;
    if (operation) {
      if (operation === 'assign') return this.applyValue(getApplyBoardEvent(status, this.selection$.value, params));
      if (operation === 'toggle') return this.toggleOption(`${params}`);
      if (operation === 'stop') this.isStopping$.next(true);
      if (this.board.logic) {
        this.board.logic.execute({
          version: SudokuState.version||'',
          sudoku: new SudokuEx({ cells: this.cells$.value }),
          operation,
          options: {
            ...this.generatorOptions$.value,
            allowDynamic: !!status.isDynamic,
            schemaMode: (status.editMode === 'schema')
          },
          params
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
    this._destroy$.unsubscribe();
  }

  private get status() {
    return this.status$.value;
  }

  private _refreshStatus() {
    this.execOperation('check');
  }

  load(s: string|Sudoku) {
    const sdk = isString(s) ? new Sudoku({ values: s }) : <Sudoku>s;
    this.cells$.next([]);
    this.sudoku$.next(sdk);
    const values = this.usePersistence ? AppUserOptions.getUserValues(sdk._id) : undefined;
    this.cells$.next(getBoardCells(sdk, false, values));
    this._refreshStatus();
    this.clearHighlights();
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
    if (this.status.isLock && isValidCellValue(e.value, this.status))
      this.lockedValue$.next(e);
    this._handleBoardChangeEvent(e);
  }

  switchProp(nm: keyof BoardStatus) {
    if (!_isBoolean(this.status[nm])) return;
    this.options(<Partial<BoardStatus>>{[nm]: !this.status[nm]});
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
      nextMode = 'next-in-square'
    } else {
      nextMode = 'none'
    }
    this.options(<Partial<BoardStatus>>{ nextMode });
    this.resetFocus();
  }

  resetFocus(timeout = 0) {
    setTimeout(() => this._board.focus(), timeout);
  }

  switchMode() {
    this.options({ editMode: this.status.editMode==='play'?'schema':'play' });
    this.resetFocus();
  }

  switchValues() {
    this.options({ valuesMode: this.status.valuesMode==='numbers'?'dots':'numbers' });
    this.resetFocus();
  }

  clearHighlights() {
    this._highlights$.next('');
  }

  setHighlights(h?: Highlights|string|undefined|null, debounce = 500) {
    this._debounce = debounce;
    this._highlights$.next(h);
  }

  clear() {
    this.execOperation('clear');
    this._highlights$.next('');
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
    this.cells$.next(r.cellsSnapshot.map(c => new BoardCell(c)));
  }

  checkLockedValue(cell: BoardCell|undefined) {
    const lockedValue = this.lockedValue$.value;
    if (!!cell && this.status.isLock && !!lockedValue) {
      const e = _clone(lockedValue);
      if (!!cell.text) e.value = '';
      e.cell = cell;
      this._handleBoardChangeEvent(e);
    }
  }
}

/**
 * alcune informazioni sono caricate dallo schema originale
 * @param statCells
 * @param sdk
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
    solution: (<SudokuInfoEx>sdk.info)?.solution
  })
}

const getApplyBoardEvent = (status: BoardStatus, cell: BoardCell|undefined, value: any): BoardChangeEvent => {
  return new BoardChangeEvent({
    cell,
    status: { ...status, isCtrl: false },
    value: `${value||''}`
  })
}
