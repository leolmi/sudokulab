import { Algorithm, PlaySudoku } from '@sudokulab/model';

export class AlgorithmResult {
  constructor(r?: Partial<AlgorithmResult>) {
    this.algorithm = '';
    this.description = '';
    this.cases = [];
    this.cells = [];
    this.applied = false;
    Object.assign(this, r || {});
  }
  algorithm: string;
  description: string;
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
