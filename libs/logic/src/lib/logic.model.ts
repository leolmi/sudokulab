import {
  GeneratorOptions,
  getStat,
  Sudoku,
  SudokuCell,
  SudokuEx,
  SUDOKULAB_TITLE,
  SudokuStat,
  ValueOptions,
  VERSION
} from '@olmi/model';
import { BehaviorSubject, Subject } from 'rxjs';

export interface ApplySudokuRulesOptions extends ValueOptions {
  /**
   * resetta lo stato degli available prima di procedere (default=false)
   */
  resetBefore?: boolean;
}

/**
 * opzioni per la verifica dello schema
 */
export interface CheckAvailableOptions extends ApplySudokuRulesOptions {
  /**
   * considera fissi tutti i valori presenti (default=false)
   */
  valueAsFixed?: boolean;
}

/**
 *
 */
export interface CheckErrorsOptions extends ApplySudokuRulesOptions {

}

/**
 * sessione di generazione: contiene tutte le info per la generazione
 * di schemi a partire da un template
 */
export class GenerationSession {
  constructor(s?: Partial<GenerationSession>) {
    this.cache = {};
    this.schemaFillCycle = s?.schemaFillCycle||0;
    this.options = new GeneratorOptions(s?.options);
    this.originalCells = s?.originalCells||[];
    this.originalStat = getStat(this.originalCells);
    this.currentStat = getStat(this.originalCells);
    this.time = s?.time||0;
    this.stopped = false;
    this.skipSchema = false;
  }

  /**
   * cache degli schemi generati
   */
  cache: any;
  /**
   * opzioni di generazione
   */
  options: GeneratorOptions;
  /**
   * celle originali (template di generazione)
   */
  originalCells: SudokuCell[];
  /**
   * statistiche dello schema originale
   */
  originalStat: SudokuStat;
  /**
   * statistiche dello schema corrente
   */
  currentStat: SudokuStat;
  /**
   * ciclo di valorizzazione
   */
  schemaFillCycle: number;
  /**
   * istante in cui è iniziata la generazione
   */
  time: number;
  /**
   * vero se è richiesto lo stop
   */
  stopped: boolean;
  /**
   * se vero ricalcola lo schema
   */
  skipSchema: boolean;
  /**
   * schema corrente
   */
  currentSchema?: SudokuEx;
}

/**
 * contesto di generazione
 */
export class GeneratorContext {
  schema$: BehaviorSubject<SudokuEx|undefined>;
  session: GenerationSession;
  schemas: any;
  ping$: Subject<any>;

  constructor() {
    this.schema$ = new BehaviorSubject<SudokuEx|undefined>(undefined);
    this.ping$ = new Subject<any>();
    this.schemas = {};
    this.session = new GenerationSession();
  }

  addSchema(s: SudokuEx|undefined) {
    if (s && !this.schemas[s.values]) {
      s.info.origin = `${SUDOKULAB_TITLE} ${VERSION}`;
      this.schemas[s.values] = true;
      this.schema$.next(s);
    }
  }

  endGeneration() {
    this.session.time = 0;
    this.session = new GenerationSession();
    this.schemas = {};
  }

  async ping(timeout = 50) {
    return new Promise<void>((res) => {
      this.ping$.next({});
      setTimeout(() => res(), timeout);
    })
  }
}

