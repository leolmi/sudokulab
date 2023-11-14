import {GeneratorStatus, PlaySudoku} from "@sudokulab/model";

export type ValuesForCells = {[cid: string]: string};

export class ValMap {
  private _complete: boolean;
  private _failed: boolean;
  valuesForCells: ValuesForCells[];
  cycle: number;

  constructor() {
    this._complete = false;
    this._failed = false;
    this.valuesForCells = [];
    this.cycle = 0;
  }

  get isComplete(): boolean {
    return this._complete;
  }

  get isDone(): boolean {
    return this.cycle >= this.valuesForCells.length;
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
}
