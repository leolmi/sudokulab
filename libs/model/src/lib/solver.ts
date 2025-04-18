import { SudokuCell } from './sudoku-cell';
import { AlgorithmResult } from './algorithm';

export class ApplyAlgorithmOptions {
  constructor(o?: Partial<ApplyAlgorithmOptions>) {
    Object.assign(<any>this, o||{});

    this.useTryAlgorithm = !!o?.useTryAlgorithm;
  }
  /**
   * abilita l'utilizzo del metodo brutal-force
   */
  useTryAlgorithm?: boolean;
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
  }

  mode: SolveMode;
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
