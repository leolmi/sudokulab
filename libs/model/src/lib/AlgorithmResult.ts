import { Sudoku } from '@sudokulab/model';

export class AlgorithmResult {
  constructor(r?: Partial<AlgorithmResult>) {
    this.cases = [];
    this.cells = [];
    this.applied = false;
    Object.assign(this, r || {});
  }
  cases: Sudoku[];
  cells: string[];
  applied: boolean;
}
