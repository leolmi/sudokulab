import { Sudoku } from './Sudoku';

export class WorkingInfo {
  constructor(i?: Partial<WorkingInfo>) {
    this.counter = 0;
    this.startedAt = 0;
    Object.assign(this, i || {});
  }
  sudoku?: Sudoku;
  counter: number;
  startedAt: number;
}
