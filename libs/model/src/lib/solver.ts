import { SudokuCell } from './sudoku-cell';
import { AlgorithmResult } from './algorithm';
import { getCellsSchema } from '../model.helper';

export class ApplyAlgorithmOptions {
  constructor(o?: Partial<ApplyAlgorithmOptions>) {
    Object.assign(<any>this, o||{});

    this.useTryAlgorithm = !!o?.useTryAlgorithm;
    this.skipAlgorithm = o?.skipAlgorithm||[];
  }
  /**
   * abilita l'utilizzo del metodo brutal-force
   */
  useTryAlgorithm?: boolean;
  /**
   * skippa gli algoritmi in elenco
   */
  skipAlgorithm?: string[];
}

export type SolveMode = 'all'|'one-step'|'to-try'|'to-step';

/**
 * Opzioni per il risolutore
 */
export class SolveOptions extends ApplyAlgorithmOptions {
  constructor(o?: Partial<SolveOptions>) {
    super(o);

    this.mode = o?.mode||'all';
    this.maxSolveCycles = o?.maxSolveCycles||250;
    this.maxSchemaFillCycles = o?.maxSchemaFillCycles||1000;
    this.maxFillCycles = o?.maxFillCycles||100;
    this.debug = !!o?.debug;
    this.allowHidden = !!o?.allowHidden;
    this.toStep = o?.toStep||-1;
    this.oracleSolution = o?.oracleSolution;
  }

  mode: SolveMode;
  /**
   * soluzione unica già nota (stringa di 81 caratteri '1'..'9'); se presente,
   * gli algoritmi di tipo `solver` (es. TryNumber) usano l'oracolo per
   * scegliere il ramo corretto invece di splittare in branch paralleli
   */
  oracleSolution?: string;
  /**
   * numero massimo di cicli di risoluzione
   */
  maxSolveCycles: number;
  /**
   * numero massimo di valorizzazioni per lo stesso schema
   */
  maxSchemaFillCycles: number;
  /**
   * numero massimo di cicli di valorizzazioni
   * (prima di annullare la ricerca di una valorizzazione valida)
   */
  maxFillCycles: number;
  allowHidden: boolean;
  debug: boolean;
  toStep: number;
}

export type SolveStatus = 'idle'|'success'|'error'|'undefined'|'out-of-range'|'try-stop'|'not-solvable';

/**
 * Soluzione dello scehma
 */
export class SolveSolution {
  constructor(s?: Partial<SolveSolution>) {
    Object.assign(<any>this, s||{});

    this.cells = (s?.cells||[]).map(c => new SudokuCell(c));
    this.sequence = (s?.sequence||[]).map(r => new AlgorithmResult(r));
    this.status = s?.status||'idle';
  }

  cells: SudokuCell[];
  sequence: AlgorithmResult[];
  status: SolveStatus;
  message?: string;

  /**
   * stringa di tutti i valori della soluzione (fissi + dinamici + user-value, lunghezza 81)
   */
  get values(): string {
    return getCellsSchema(this.cells, { allowDynamic: true, allowUserValue: true });
  }
}

/**
 *
 */
export class SolveWork {
  constructor(w?: Partial<SolveWork>) {
    Object.assign(<any>this, w||{});

    this.start = Date.now();
    this.end = 0;
    this.counter = 0;
    this.options = new SolveOptions(w?.options);
    if (this.options.mode === 'to-try') this.options.useTryAlgorithm = false;
    this.solutions = (w?.solutions||[]).map(s => new SolveSolution(s));
  }

  start: number;
  end: number;
  counter: number;
  options: SolveOptions;
  solutions: SolveSolution[];
}

export class SolveStat {
  isOutOfRange?: boolean;
  isSuccess?: boolean;
  unique?: boolean;
  isUniqueSuccess?: boolean;
  solution?: SolveSolution;
  error?: string;
}
