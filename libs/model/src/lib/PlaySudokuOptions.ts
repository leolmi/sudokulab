import { SUDOKU_DEFAULT_MAXSPLIT } from './consts';

export class PlaySudokuOptions {
  constructor(o?: Partial<PlaySudokuOptions>) {
    this.usePencil = false;
    this.showAvailables = false;
    this.maxSplitSchema = SUDOKU_DEFAULT_MAXSPLIT;
    this.excludeTryAlgorithm = false;
    Object.assign(this, o || {});
  }
  usePencil: boolean;
  showAvailables: boolean;
  maxSplitSchema: number;
  excludeTryAlgorithm: boolean;
}
