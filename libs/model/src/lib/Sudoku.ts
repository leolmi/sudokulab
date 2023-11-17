import {SudokuOptions} from './SudokuOptions';
import {has as _has, repeat as _repeat} from 'lodash';
import {SudokuInfo} from './SudokuInfo';
import {SUDOKU_DEFAULT_RANK, SUDOKU_STANDARD_CHARACTERS} from './consts';
import {calcFixedCount, getHash} from '../global.helper';

export class Sudoku {
  constructor(s?: Partial<Sudoku>) {
    this._id = 0;
    this.rank = SUDOKU_DEFAULT_RANK;
    this.values = '';
    this.fixed = '';
    Object.assign(this, s || {});
    consolidate(this);
    this.options = new SudokuOptions(s?.options);
    this.info = new SudokuInfo(s?.info);
    this.info.rank = this.rank;
    this.info.fixedCount = calcFixedCount(this.fixed);
  }
  _id: number;
  rank: number;
  values: string;
  fixed: string;
  options: SudokuOptions;
  info: SudokuInfo;
  name?: string;
}

export const getFixedValuesEmpty = (sdk: Sudoku) => _repeat(SUDOKU_STANDARD_CHARACTERS.empty, sdk.rank * sdk.rank);

export const consolidate = (sdk: Sudoku) => {
  const fixed = getFixedValuesEmpty(sdk);
  sdk.values = sdk.values || sdk.fixed || fixed;
  sdk.fixed = sdk.fixed || fixed;
  sdk._id = getHash(sdk.fixed);
}

export const isSudoku = (sdk: any): boolean => {
  return !!sdk?._id
    && _has(sdk, 'rank')
    && _has(sdk, 'fixed')
    && _has(sdk, 'values')
    && _has(sdk, 'info');
}
