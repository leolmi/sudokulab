import {SudokuMessage} from "./SudokuMessage";
import {PlaySudoku} from "./PlaySudoku";
import {Sudoku} from "./Sudoku";
import {UserData} from "./UserData";

export const SDK_DEFAULT_GENERATOR_TIMEOUT = 250;
export const SDK_GENERATOR_USER_DATA_KEY = 'SUDOKULAB_GENERATOR_USERDATA';

export enum GeneratorAction {
  // for worker:
  run = 'run',
  stop = 'stop',
  generate = 'generate',

  // for manager:
  clear = 'clear',
  check = 'check',
  download = 'download',
  downloadAll = 'downloadAll',
  upload = 'upload',
  removeAll = 'removeAll',
  openInLab = 'openInLab',
}

export enum GeneratorMode {
  /**
   * modalità non rilevabile
   */
  unknown = 'unknown',
  /**
   * Singolo schema: il numero di valori fissati è pari al numero di valori richiesti
   */
  single = 'single',
  /**
   * Solo valorizzazioni: il numero di valori fissati e quelli dinamici sono pari al
   * numero di valori richiesti, è quindi necessario solo sviluppare le valorizzazioni
   */
  fixed = 'fixed',
  /**
   * Generazione di schemi: il numero di valori fissati e dinamici è inferiore al numero
   * di valori richiesti percui è necessario generare celle da valorizzare quindi completare
   * lo schema prima di sviluppare le valorizzazioni
   */
  multiple = 'multiple',
}

export class GeneratorStatus {
  constructor(s?: Partial<GeneratorStatus>) {
    this.dynamics = 0;
    this.fixed = 0;
    this.generated = 0;
    this.total = 0;
    this.mode = GeneratorMode.unknown;
    this.running = false;
    this.stopping = false;
    this.generatedSchemas = [];
    Object.assign(this, s || {});
  }
  fixed: number;
  dynamics: number;
  generated: number;
  total: number;
  mode: GeneratorMode;
  running?: boolean;
  stopping?: boolean;
  workingSchema?: Sudoku;
  generatedSchema?: Sudoku;
  generatedSchemas?: Sudoku[];
}

export interface GeneratorWorkerArgs {
  sdk?: PlaySudoku;
  timeout?: number;
  action?: GeneratorAction;
}

export interface GeneratorWorkerData {
  message?: SudokuMessage;
  status?: GeneratorStatus;
  sdk?: PlaySudoku;
}

export interface GeneratorWorkingInfo {
  steps?: number;
}

/**
 * dati utente dl generatore
 * - opzioni
 * - valori inseriti
 */
export class GeneratorUserData extends UserData {
  constructor(ud?: Partial<GeneratorUserData>) {
    super(ud);
    this.values = ud?.values||'';
  }
  values: string;
}
