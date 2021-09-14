import { Sudoku } from './lib/Sudoku';
import { ElementRef } from '@angular/core';
import { PlaySudoku } from './lib/PlaySudoku';
import { forEach as _forEach, keys as _keys, includes as _includes, isString as _isString } from 'lodash';
import { PlaySudokuCellAlignment, SudokuGroupType } from './lib/enums';
import {
  AlignmentOnGroupAlgorithm,
  OneCellForValueAlgorithm,
  OneValueForCellAlgorithm, TRY_NUMBER_ALGORITHM,
  TryNumberAlgorithm
} from './lib/Algorithms';
import { PlayAlgorithm } from './lib/Algorithm';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { CellInfo } from './lib/CellInfo';
import { AVAILABLE_DIRECTIONS } from './lib/consts';
import { EditSudokuOptions } from '.';

export const use = <T>(o$: Observable<T>, handler: (o:T) => any): any => o$.pipe(take(1)).subscribe(o => handler(o));

export const getHash = (o: any): number => {
  o = o || '';
  if (!_isString(o)) {
    o = JSON.stringify(o);
  }
  let hash = 0, i, chr;
  if (o.length === 0) {
    return hash;
  }
  for (i = 0; i < o.length; i++) {
    chr = o.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

export const cellId = (column: number, row: number) => `${column}.${row}`;

export const decodeCellId = (id: string): CellInfo => {
  const parts = (id || '').split('.');
  return new CellInfo(parseInt(parts[0] || '-1', 10), parseInt(parts[1] || '-1'));
}

export const groupId = (type: SudokuGroupType, pos: number) => `${type}.${pos}`;

export const getGroupRank = (rank: number): number => Math.sqrt(rank||9);

export const getCellStyle = (sdk: Sudoku|undefined, ele: ElementRef): any => {
  const pxlw = sdk ? Math.floor(ele.nativeElement.parentElement.clientWidth / sdk.rank) : 40;
  const pxlh = sdk ? Math.floor(ele.nativeElement.parentElement.clientHeight / sdk.rank) : 40;
  const mindim = Math.min(pxlw, pxlh);
  const fnts = sdk ? Math.floor( mindim / 2) : 20;
  return {
    width: `${pxlw}px`,
    height: `${pxlh}px`,
    'font-size': `${fnts}px`
  }
}

export const getLinesGroups = (sdk: Sudoku|EditSudokuOptions|undefined): {[id: number]: boolean} => {
  const res: {[id: number]: boolean} = {};
  const grank = getGroupRank(sdk?.rank||9);
  for(let g = 0; g < (sdk?.rank||9)-1; g++) {
    res[g] = ((g+1)%grank === 0);
  }
  return res;
}

const _algorithms: PlayAlgorithm[] = [];

const _checkAlgorithms = () => {
  if (_algorithms.length<1) {
    _algorithms.push(
      new OneCellForValueAlgorithm(),
      new OneValueForCellAlgorithm(),
      new AlignmentOnGroupAlgorithm(),
      new TryNumberAlgorithm());
  }
}

export const getAlgorithms = (exclude: string[] = []) => {
  _checkAlgorithms();
  return _algorithms.filter(a => !_includes(exclude, a.id));
};

export const getAlgorithm = (code: string): PlayAlgorithm|undefined => {
  _checkAlgorithms();
  return _algorithms.find(a => a.id === code);
}

export const getAlignment = (cid1: string, cid2: string): PlaySudokuCellAlignment => {
  const id1 = cid1.split('.');
  const id2 = cid2.split('.');
  if (id1[0] === id2[0]) return PlaySudokuCellAlignment.vertical;
  if (id1[1] === id2[1]) return PlaySudokuCellAlignment.horizontal;
  return PlaySudokuCellAlignment.none;
}

export const getValues = (sdk: PlaySudoku|undefined): string => {
  const rank = sdk?.sudoku?.rank||81;
  let values = '';
  for (let r = 0; r < rank; r++) {
    for (let c = 0; c < rank; c++) {
      values = `${values}${sdk?.cells[cellId(c, r)]?.value||'0'}`
    }
  }
  return values;
}

export const getAvailables = (sdk: PlaySudoku|undefined): string[] => {
  return Array(sdk?.sudoku?.rank||9).fill(0).map((x, i)=>`${(i+1)}`)
}

export const isValidValue = (sdk: PlaySudoku|undefined, value: string): boolean => {
  console.log('VALID VALUE', value);
  return (value.length === 1 && /[1-9a-fA-F]/g.test(value)) || ['Delete', ' '].indexOf(value)>-1;
}

export const resetAvailables = (sdk: PlaySudoku|undefined) => {
  _forEach(sdk?.cells||{}, (c) => {
    if (!!c) c.availables = c.value ? [] : getAvailables(sdk);
  });
}

export const isDirectionKey = (direction: string): boolean => {
  return _keys(AVAILABLE_DIRECTIONS).indexOf(direction)>-1;
}

export const getSchemaName = (sdk: PlaySudoku|undefined): string => {
  const rank = sdk?.sudoku?.rank||9;
  const fixc = sdk?.state.fixedCount||0;
  const hash = getHash(sdk?.sudoku?.fixed||'');
  const diff = sdk?.sudoku?.info?.difficulty||'unknown';
  const tryN = (sdk?.sudoku?.info?.difficultyMap||{})[TRY_NUMBER_ALGORITHM];
  const tryd = !!tryN ? `_T${tryN}` : '';
  return `${rank}x${rank}_${fixc}num_${diff}${tryd}(${hash})`;
}
