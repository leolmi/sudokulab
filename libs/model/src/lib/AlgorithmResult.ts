import {PlaySudoku} from "./PlaySudoku";
import {getValues} from "../sudoku.helper";


export class AlgorithmResultLine {
  constructor(l?: Partial<AlgorithmResultLine>) {
    this.description = '';
    this.cell = '';
    this.others = [];
    this.withValue = false;
    Object.assign(this, l || {});
  }
  description: string;
  cell: string;
  others: string[];
  withValue: boolean;
}


export class AlgorithmResult {
  constructor(r?: Partial<AlgorithmResult>, sdk?: PlaySudoku) {
    this.algorithm = '';
    this.values = sdk ? getValues(sdk) : '';
    this.descLines = [];
    this.cases = [];
    this.cells = [];
    this.applied = false;
    Object.assign(this, r || {});
  }
  algorithm: string;
  values: string;
  value?: string;
  descLines: AlgorithmResultLine[];
  cases: PlaySudoku[];
  cells: string[];
  applied: boolean;

  static none(alg: Algorithm): AlgorithmResult {
    return new AlgorithmResult({
      algorithm: alg.name,
      applied: false
    })
  }
}
