import { Algorithm, PlaySudoku } from '@sudokulab/model';

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
  constructor(r?: Partial<AlgorithmResult>) {
    this.algorithm = '';
    this.descLines = [];
    this.cases = [];
    this.cells = [];
    this.applied = false;
    Object.assign(this, r || {});
  }
  algorithm: string;
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
