import { Sudoku } from '@sudokulab/model';

export class HandleImageResult {
  constructor(r?: Partial<HandleImageResult>) {
    Object.assign(this, r || {});
  }
  sdk?: Sudoku;
  onlyValues?: boolean;
}
