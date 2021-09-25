import { SudokuOptions } from './SudokuOptions';
import { repeat as _repeat } from 'lodash';
import { SudokuInfo } from './SudokuInfo';
import { SUDOKU_EMPTY_VALUE } from './consts';
import { getHash } from '../global.helper';

export class Sudoku {
  constructor(s?: Partial<Sudoku>) {
    this._id = 0;
    this.rank = 9;
    this.values = '';
    this.fixed = '';
    Object.assign(this, s || {});
    consolidate(this);
    this.options = new SudokuOptions(s?.options);
    this.info = new SudokuInfo(s?.info);
  }
  _id: number;
  rank: number;
  values: string;
  fixed: string;
  options: SudokuOptions;
  info: SudokuInfo;
}

export const consolidate = (sdk: Sudoku) => {
  sdk.values = sdk.values || sdk.fixed || _repeat(SUDOKU_EMPTY_VALUE, sdk.rank * sdk.rank);
  sdk.fixed = sdk.fixed || _repeat(SUDOKU_EMPTY_VALUE, sdk.rank * sdk.rank);
  sdk._id = getHash(sdk.fixed);
}
