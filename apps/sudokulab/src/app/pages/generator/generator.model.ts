import {
  GeneratorOptions,
  GeneratorStatus,
  PlaySudoku,
  PlaySudokuCell,
  SUDOKU_DEFAULT_MAX_VAL_CYCLES
} from "@sudokulab/model";
import {last as _last} from 'lodash';

export type ValuesForCells = {[cid: string]: string};

export interface ValCell {
  cell: PlaySudokuCell;
  index: number;
}

export class ValMap {
  private _complete: boolean;
  private _failed: boolean;
  maxValCycles: number;
  cache: any;
  valuesForCells?: ValuesForCells;
  cycle: number;
  valCells: ValCell[];
  isRandomValues: boolean;

  constructor() {
    this._complete = false;
    this._failed = false;
    this.valuesForCells = undefined;
    this.cycle = -1;
    this.valCells = [];
    this.cache = {};
    this.maxValCycles = SUDOKU_DEFAULT_MAX_VAL_CYCLES;
    this.isRandomValues = true;
  }

  get isComplete(): boolean {
    return this._complete;
  }

  get isDone(): boolean {
    return this._complete || this.cycle >= this.maxValCycles;
  }

  complete(failed = false) {
    this._complete = true;
    this._failed = failed;
    return this;
  }
}

export interface GeneratorWorkerState {
  timeout: any;
  status: GeneratorStatus;
  sdk: PlaySudoku;
  activeSdk?: PlaySudoku;
  cache: any;
  valMap?: ValMap;
  schemaCache: any;
  noSchema: boolean;
  start: number;
}
