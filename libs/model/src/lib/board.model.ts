import {Dictionary} from "@ngrx/entity";
import {PlaySudoku} from "./PlaySudoku";
import {SudokuMessage} from "./SudokuMessage";
import {SolveStepResult} from "./logic";
import {AlgorithmResultLine} from "./AlgorithmResult";
import {PlaySudokuOptions} from "./PlaySudokuOptions";
import {UserData} from "./UserData";
import {GroupInfo} from "./CellInfo";

export const BOARD_WORKER_USER_DATA_KEY = 'SUDOKULAB_WBOARD_USERDATA';

export enum BoardAction {
  check = 'check',
  solve = 'solve',
  solveStep = 'solveStep',
  solveToTry = 'solveToTry',
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

export const CLEAR_INFOS_ACTION: any = {
  [BoardAction.solve]: true,
  [BoardAction.solveStep]: true,
  [BoardAction.clear]: true,
  [BoardAction.value]: true,
}

export class BoardWorkerHighlights {
  constructor() {
    this.cell = {};
    this.cellValue = {};
    this.others = {};
    this.groups = [];
  }

  cell: Dictionary<boolean>;
  cellValue: Dictionary<boolean>;
  others: Dictionary<boolean>;
  groups: GroupInfo[];

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
export class BoardUserData extends UserData {
  constructor(ud?: Partial<BoardUserData>) {
    super(ud);
    this.schema = ud?.schema||{};
  }
  schema: Dictionary<SchemaData>;
}

/**
 * rappresenta l'evidenziazione di un gruppo
 */
export class BoardWorkerHighlightGroup {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
}
