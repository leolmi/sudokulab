import { SudokuOptions } from './SudokuOptions';
import { repeat as _repeat } from 'lodash';
import { SudokuInfo } from './SudokuInfo';

export class Sudoku {
  constructor(s?: Partial<Sudoku>) {
    this.id = '';
    this.rank = 9;
    this.values = '';
    this.fixed = '';
    Object.assign(this, s || {});
    consolidate(this);
    this.options = new SudokuOptions(s?.options);
    this.info = new SudokuInfo(s?.info);
  }
  id: string;
  rank: number;
  values: string;
  fixed: string;
  options: SudokuOptions;
  info: SudokuInfo;
}

export const consolidate = (sdk: Sudoku) => {
  sdk.values = sdk.values || sdk.fixed || _repeat('0', sdk.rank * sdk.rank);
  sdk.fixed = sdk.fixed || _repeat('0', sdk.rank * sdk.rank);
  sdk.id = sdk.fixed;
}
