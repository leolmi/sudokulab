import { Algorithm } from './Algorithm';

export class SudokuSolution {
  constructor(s?: Partial<SudokuSolution>) {
    this.algorithms = [];
    Object.assign(this, s || {});
  }
  algorithms: Algorithm[];
}
