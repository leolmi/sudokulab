import { DestroyRef, effect, inject, Injectable, signal, Signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { cloneDeep as _clone, isBoolean as _isBoolean, isString, last as _last } from 'lodash';
import {
  AlgorithmResult,
  applySudokuRules,
  ApplySudokuRulesOptions,
  decodeHighlightsString,
  Dictionary,
  GenerationStat,
  GeneratorOptions,
  getCell,
  getCellsSchema,
  getStat,
  Highlights,
  isNumberCellValue,
  LogicExecutor,
  LogicOperation,
  LogicWorkerData,
  NotificationType,
  Sudoku,
  SudokuEx,
  SudokuInfoEx,
  SudokuStat,
  ValueOptions,
} from '@olmi/model';
import { AppUserOptions, SUDOKU_NOTIFIER, SudokuState } from '@olmi/common';
import { clearCell } from '@olmi/logic';
import { BoardCell, BoardChangeEvent, BoardStatus } from './board.model';
import { buildSchemaBoard, getBoardCells, getSequence } from './board.helper';
import { handleBoardValue } from './board-component.helper';

/**
 * Servizio per-board: gestisce stato (cells/status/selection/highlights/...)
 * e orchestrazione del logic-worker. Headless: non conosce il
 * `BoardComponent`, espone solo `Signal<T>` readonly + metodi imperativi.
 *
 * Provided sul `BoardComponent` (default per-istanza). Un consumer che vuole
 * condividere lo stesso manager fra board e UI dichiara `providers:
 * [BoardManager]` a livello componente: la DI hierarchy unifica le istanze.
 *
 * Eventi non-stato (highlights con debounce, focus richiesto al componente)
 * sono `Subject` privati. Il teardown è automatico via `DestroyRef` del
 * provider scope.
 */
@Injectable()
export class BoardManager {
  private readonly _notifier = inject(SUDOKU_NOTIFIER, { optional: true });
  private readonly _destroyRef = inject(DestroyRef);

  // sorgente di verità: WritableSignal privati
  private readonly _generatorOptions = signal<GeneratorOptions>(new GeneratorOptions());
  private readonly _status = signal<BoardStatus>(new BoardStatus());
  private readonly _stat = signal<SudokuStat>(new SudokuStat());
  private readonly _generationStat = signal<GenerationStat | undefined>(undefined);
  private readonly _multiGenerationStat = signal<Dictionary<GenerationStat | undefined>>({});
  private readonly _cells = signal<BoardCell[]>(buildSchemaBoard());
  private readonly _sequence = signal<AlgorithmResult[]>([]);
  private readonly _sudoku = signal<Sudoku>(new Sudoku());
  private readonly _focused = signal<boolean>(false);
  private readonly _isStopping = signal<boolean>(false);
  private readonly _selection = signal<BoardCell | undefined>(undefined);
  private readonly _lockedValue = signal<BoardChangeEvent | undefined>(undefined);
  private readonly _highlights = signal<Highlights>(new Highlights());

  // API pubblica readonly
  readonly generatorOptions: Signal<GeneratorOptions> = this._generatorOptions.asReadonly();
  readonly status: Signal<BoardStatus> = this._status.asReadonly();
  readonly stat: Signal<SudokuStat> = this._stat.asReadonly();
  readonly generationStat: Signal<GenerationStat | undefined> = this._generationStat.asReadonly();
  readonly multiGenerationStat: Signal<Dictionary<GenerationStat | undefined>> = this._multiGenerationStat.asReadonly();
  readonly cells: Signal<BoardCell[]> = this._cells.asReadonly();
  readonly sequence: Signal<AlgorithmResult[]> = this._sequence.asReadonly();
  readonly sudoku: Signal<Sudoku> = this._sudoku.asReadonly();
  readonly focused: Signal<boolean> = this._focused.asReadonly();
  readonly isStopping: Signal<boolean> = this._isStopping.asReadonly();
  readonly selection: Signal<BoardCell | undefined> = this._selection.asReadonly();
  readonly lockedValue: Signal<BoardChangeEvent | undefined> = this._lockedValue.asReadonly();
  readonly highlights: Signal<Highlights> = this._highlights.asReadonly();

  // contatore "tick" di richieste di focus: il manager incrementa quando vuole
  // che il componente dia focus al DOM; il componente reagisce con un effect
  // che ignora il primo run (valore iniziale) e chiama `element.focus()` sui
  // successivi.
  private readonly _focusTick = signal<number>(0);
  readonly focusTick: Signal<number> = this._focusTick.asReadonly();

  // logic executor (worker boundary): il componente lo passa via setLogic
  private _logic: LogicExecutor | undefined;

  // debounce highlights (tempo a cui applicare effettivamente l'evento)
  private _highlightsTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly DEFAULT_HIGHLIGHTS_DEBOUNCE = 500;

  usePersistence = false;

  constructor() {
    // status → reset lockedValue quando il lock viene rilasciato
    effect(() => {
      const s = this._status();
      if (!s.isLock && untracked(() => !!this._lockedValue())) {
        untracked(() => this._lockedValue.set(undefined));
      }
    });

    // cells/sudoku → ricalcolo stat (filtro: cells non vuote)
    effect(() => {
      const cells = this._cells();
      const sdk = this._sudoku();
      if ((cells || []).length === 0) return;
      const stat = getStat(cells);
      if (!stat.isEmpty && sdk._id && this.usePersistence) {
        AppUserOptions.setUserValues(sdk._id, stat.userValues);
      }
      untracked(() => this._stat.set(mergeStat(stat, sdk)));
    });

    // teardown: cancella eventuale debounce pendente
    this._destroyRef.onDestroy(() => {
      if (this._highlightsTimer) clearTimeout(this._highlightsTimer);
    });
  }

  /**
   * Aggancia il logic-executor (worker). Si può chiamare più volte: ogni cambio
   * scollega l'executor precedente (le subscribe sono auto-disposed dal
   * DestroyRef del provider scope).
   */
  setLogic(logic: LogicExecutor | undefined) {
    if (this._logic === logic) return;
    this._logic = logic;
    if (!logic) return;
    logic.completed
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((data: LogicWorkerData) => this._onLogicCompleted(data));
  }

  private _onLogicCompleted(data: LogicWorkerData) {
    if (data.sudoku && !data.allowHidden) {
      this._cells.set(getBoardCells(data.sudoku));
    }
    this._sequence.set(getSequence(data));
    SudokuState.setIsRunning(!!data.isRunning);
    if (!data.isRunning) this._isStopping.set(false);
    this._generationStat.set(data.isRunning ? data.generationStat : undefined);
    this._multiGenerationStat.update(prev => ({
      ...prev,
      [data.index]: data.isRunning ? data.generationStat : undefined,
    }));
    this._checkHighlights(data);
    this._checkNotifies(data);
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
            this._scheduleHighlights(new Highlights(item.highlights), BoardManager.DEFAULT_HIGHLIGHTS_DEBOUNCE);
        }
      }
    }
  }

  private _checkNotifies(data: LogicWorkerData) {
    if (!this._notifier || !this._status()?.isNotify) return;
    switch (data.operation) {
      case 'solve':
        if (data.error) {
          this._notifier.notify(data.error, NotificationType.error);
        } else if (data.sudoku) {
          this._notifier.notify('Schema solved successfully', NotificationType.success);
        }
        break;
      default:
        if (data.error) {
          this._notifier.notify(data.error, NotificationType.error);
        }
        break;
    }
  }

  private _scheduleHighlights(h: Highlights | string | undefined | null, debounce: number) {
    if (this._highlightsTimer) clearTimeout(this._highlightsTimer);
    const apply = () => this._highlights.set(toHighlights(h));
    if (debounce <= 0) apply();
    else this._highlightsTimer = setTimeout(apply, debounce);
  }

  private _internalLogicExecute(operation?: LogicOperation, params?: any) {
    switch (operation) {
      case 'apply-rules':
        this._cells.update(prev => {
          const co = _clone(prev);
          applySudokuRules(co, <ApplySudokuRulesOptions>params);
          return co;
        });
        break;
      case 'clear':
        this._cells.update(prev => {
          const co = _clone(prev);
          co.forEach((c) => clearCell(c));
          return co;
        });
        break;
    }
  }

  execOperation(operation?: LogicOperation, params?: any) {
    if (!operation) return;
    const status = this._status();
    if (operation === 'assign')
      return this.applyValue(getApplyBoardEvent(status, this._selection(), params));
    if (operation === 'toggle') return this.toggleOption(`${params}`);
    if (operation === 'stop') this._isStopping.set(true);
    if (this._logic) {
      this._logic.execute({
        sudoku: new SudokuEx({ cells: this._cells() }),
        operation,
        options: {
          ...this._generatorOptions(),
          allowDynamic: !!status.isDynamic,
          schemaMode: status.editMode === 'schema',
        },
        params,
      });
    } else {
      this._internalLogicExecute(operation, params);
    }
  }

  updateGeneratorOptions(o: GeneratorOptions) {
    this._generatorOptions.set(o);
  }

  private _refreshStatus() {
    this.execOperation('check');
  }

  load(s: string | Sudoku) {
    const sdk = isString(s) ? new Sudoku({ values: s }) : <Sudoku>s;
    this._cells.set([]);
    this._sudoku.set(sdk);
    const values = this.usePersistence ? AppUserOptions.getUserValues(sdk._id) : undefined;
    this._cells.set(getBoardCells(sdk, false, values));
    this._refreshStatus();
    this.clearHighlights();
  }

  values(s: string | null) {
    if (!s || s.length !== 81) return;
    this._cells.update(prev => {
      const co = _clone(prev);
      co.forEach((c, i) => {
        if (!c.isFixed) {
          const cv = s.charAt(i);
          c.text = isNumberCellValue(cv) ? cv : '';
        }
      });
      return co;
    });
  }

  /**
   * Forza gli `available` delle celle indicate sovrascrivendo quanto
   * calcolato da `apply-rules`. Serve soprattutto agli esempi didattici
   * (algorithm-info) quando lo snapshot di fase non è autoconsistente.
   */
  forceAvailable(map: Dictionary<string>) {
    if (!map) return;
    this._cells.update(prev => {
      const co = _clone(prev);
      co.forEach((c) => {
        const forced = map[c.coord];
        if (forced == null) return;
        c.available = forced.split('').filter((ch) => isNumberCellValue(ch));
      });
      return co;
    });
  }

  options(o: Partial<BoardStatus>, fixed?: Partial<BoardStatus>) {
    this._status.update(prev => ({ ...prev, ...o, ...fixed }));
  }

  toggleOption(pn: string) {
    this._status.update(prev => ({ ...prev, [pn]: !(<any>prev)[pn] }));
  }

  private _handleBoardChangeEvent(e: BoardChangeEvent) {
    const next = handleBoardValue(this._cells(), e);
    if (next) this._cells.set(next);
    this._refreshStatus();
    this.clearHighlights();
  }

  applyValue(e: BoardChangeEvent) {
    // con isLock attivo il lock "segue" l'ultima azione esplicita
    if (this._status().isLock) this._lockedValue.set(e);
    this._handleBoardChangeEvent(e);
  }

  switchProp(nm: keyof BoardStatus) {
    const status = this._status();
    if (!_isBoolean(status[nm])) return;
    this.options(<Partial<BoardStatus>>{ [nm]: !status[nm] });
    this.requestFocus();
  }

  /**
   * Seleziona una cella per id o riferimento; se isDisabled non fa nulla.
   * Esegue il check del lockedValue (long-press toolbar) e richiede focus.
   */
  select(id: string | BoardCell | undefined | null) {
    if (this._status().isDisabled) return;
    const cell = <BoardCell | undefined>getCell(this._cells(), id ?? undefined);
    this._selection.set(cell);
    this.checkLockedValue(cell);
    this.requestFocus();
  }

  cycleNextMode() {
    let nextMode = this._status().nextMode;
    if (nextMode === 'none') {
      nextMode = 'next-in-row';
    } else if (nextMode === 'next-in-row') {
      nextMode = 'next-in-square';
    } else {
      nextMode = 'none';
    }
    this.options(<Partial<BoardStatus>>{ nextMode });
    this.requestFocus();
  }

  /** Chiede al componente di mettere il focus DOM sulla board. */
  requestFocus() {
    this._focusTick.update(v => v + 1);
  }

  switchMode() {
    this.options({
      editMode: this._status().editMode === 'play' ? 'schema' : 'play',
    });
    this.requestFocus();
  }

  switchValues() {
    this.options({
      valuesMode: this._status().valuesMode === 'numbers' ? 'dots' : 'numbers',
    });
    this.requestFocus();
  }

  clearHighlights() {
    this._scheduleHighlights('', 0);
  }

  setHighlights(h?: Highlights | string | undefined | null, debounce = BoardManager.DEFAULT_HIGHLIGHTS_DEBOUNCE) {
    this._scheduleHighlights(h, debounce);
  }

  setLockedValue(e: BoardChangeEvent | undefined) {
    this._lockedValue.set(e);
  }

  setSelection(cell: BoardCell | undefined) {
    this._selection.set(cell);
  }

  setFocused(focused: boolean) {
    this._focused.set(focused);
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
    return getCellsSchema(this._cells(), o);
  }

  applyStep(r: AlgorithmResult) {
    if (!r || !r.cellsSnapshot) return;
    this._cells.set(r.cellsSnapshot.map((c) => new BoardCell(c)));
  }

  checkLockedValue(cell: BoardCell | undefined) {
    const lockedValue = this._lockedValue();
    if (!!cell && this._status().isLock && !!lockedValue) {
      const e = _clone(lockedValue);
      if (cell.text) e.value = '';
      e.cell = cell;
      this._handleBoardChangeEvent(e);
    }
  }
}

const toHighlights = (h: Highlights | string | undefined | null): Highlights => {
  if (!h) return new Highlights();
  if (isString(h)) return decodeHighlightsString(h);
  return h;
};

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
};

const getApplyBoardEvent = (status: BoardStatus, cell: BoardCell | undefined, value: any): BoardChangeEvent => {
  return new BoardChangeEvent({
    cell,
    status: { ...status, isCtrl: false },
    value: `${value || ''}`,
  });
};
