import { Sudoku } from '@sudokulab/model';

export class AlgorithmResult {
  constructor(r?: Partial<AlgorithmResult>) {
    this.algorithm = '';
    this.cases = [];
    this.cells = [];
    this.applied = false;
    Object.assign(this, r || {});
  }
  algorithm: string;
  cases: Sudoku[];
  cells: string[];
  applied: boolean;
}
