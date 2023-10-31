import {Dictionary} from "@ngrx/entity";
import {PlaySudoku} from "./PlaySudoku";
import {SudokuMessage} from "./SudokuMessage";
import {SolveStepResult} from "./logic";
import {AlgorithmResultLine} from "./AlgorithmResult";

export const BOARD_WORKER_USER_DATA_KEY = 'SUDOKULAB_WBOARD_USERDATA';

export enum BoardAction {
  check = 'check',
  solve = 'solve',
  solveStep = 'solveStep',
  calcStep = 'calcStep',
  clear = 'clear',
  pencil = 'pencil',
  value = 'value',
  infoLine = 'infoLine',
  available = 'available',
  download = 'download',
  camera = 'camera',
  upload = 'upload',
  details = 'details',
}

export class BoardWorkerHighlights {
  constructor() {
    this.cell = {};
    this.cellValue = {};
    this.others = {};
  }

  cell: Dictionary<boolean>;
  cellValue: Dictionary<boolean>;
  others: Dictionary<boolean>;

  static get empty() {
    return new BoardWorkerHighlights();
  }
}

export interface BoardWorkerData {
  sdk?: PlaySudoku;
  message?: SudokuMessage;
  highlights?: BoardWorkerHighlights;
  infos?: SolveStepResult[];
}

export interface BoardWorkerArgs {
  sdk?: PlaySudoku;
  action?: BoardAction;
  value?: string;
  cellId?: string;
  timeout?: number;
  info?: AlgorithmResultLine;
}

/**
 * dati di cella
 */
export interface CellData {
  pencil?: string[];
  value?: string;
}

/**
 * dati di schema persistiti per utente
 */
export interface SchemaData {
  cells?: Dictionary<CellData>;
  options?: any;
}

/**
 * dati utente sulle modifiche agli schemi
 */
export class BoardUserData {
  constructor(d?: Partial<BoardUserData>) {
    this.schema = {};
    Object.assign(this, d || {});
  }
  schema: Dictionary<SchemaData>;
}
