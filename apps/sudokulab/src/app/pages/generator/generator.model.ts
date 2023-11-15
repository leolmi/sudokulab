import {GeneratorStatus, PlaySudoku, PlaySudokuCell} from "@sudokulab/model";

export type ValuesForCells = {[cid: string]: string};

export interface ValCell {
  cell: PlaySudokuCell;
  index: number;
}

export class ValMap {
  private _complete: boolean;
  private _failed: boolean;
  valuesForCells: ValuesForCells[];
  cycle: number;
  valCells: ValCell[];
  valCycle: number;

  constructor() {
    this._complete = false;
    this._failed = false;
    this.valuesForCells = [];
    this.cycle = -1;
    this.valCells = [];
    this.valCycle = 0;
  }

  get isComplete(): boolean {
    return this._complete;
  }

  get isDone(): boolean {
    return this.valuesForCells.length > 0 && this.cycle >= this.valuesForCells.length;
  }

  complete(failed = false) {
    this._complete = true;
    this._failed = failed;
    return this;
  }

  getValuesForCells() {
    if (this.cycle < 0) return {};
    return this.valuesForCells[this.cycle];
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
