import { Sudoku } from './lib/Sudoku';
import { ElementRef } from '@angular/core';
import { getGroupRank, PlaySudoku } from './lib/PlaySudoku';
import { forEach as _forEach, isEmpty as _isEmpty, remove as _remove, values as _values, reduce as _reduce } from 'lodash';
import { Dictionary } from '@ngrx/entity';
import { Algorithms, PlaySudokuCellAlignment } from './lib/enums';
import {
  AlignmentOnGroupAlgorithm,
  OneCellForValueAlgorithm,
  OneValueForCellAlgorithm,
  TryNumberAlgorithm,
  TwinsAlgorithm
} from './lib/Algorithms';
import { PlayAlgorithm } from './lib/Algorithm';

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

export const getLinesGroups = (sdk: Sudoku|undefined): {[id: number]: boolean} => {
  const res: {[id: number]: boolean} = {};
  const grank = getGroupRank(sdk);
  for(let g = 0; g < (sdk?.rank||9)-1; g++) {
    res[g] = ((g+1)%grank === 0);
  }
  return res;
}

const _isValue = (v: string): boolean => (v||'')!=='';

export const checkAvailables = (ps: PlaySudoku|undefined) => {
  _forEach(ps?.groups||{}, (g) => {
    if (!g) return;
    const values: Dictionary<boolean> = {};
    g.cells.forEach(c => _isValue(c.value) ? values[c.value] = true : null);
    g.cells.forEach(c => _remove(c.availables, av => values[av] || _isValue(c.value)));
  });
  _forEach(ps?.groups||{}, (g) => {
    if (!g) return;
    g.availableOnCells = {};
    g.couples = [];
    g.cells.forEach(c => {
      c.availables.forEach(av => {
        const avs = `${av}`;
        g.availableOnCells[avs] = g.availableOnCells[avs] || {};
        (g.availableOnCells[avs] || {})[c.id] = true;
      });
      if (c.availables.length === 2) g.couples.push(c);
    });
  });
}


const _algorithms: PlayAlgorithm[] = [];

const _checkAlgorithms = () => {
  if (_algorithms.length<1) {
    _algorithms.push(
      new OneCellForValueAlgorithm(),
      new OneValueForCellAlgorithm(),
      new AlignmentOnGroupAlgorithm(),
      new TwinsAlgorithm(),
      new TryNumberAlgorithm());
  }
}

export const getAlgorithms = () => {
  _checkAlgorithms();
  return _algorithms;
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
