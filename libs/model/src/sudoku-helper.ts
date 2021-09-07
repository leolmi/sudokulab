import { Sudoku } from './lib/Sudoku';
import { ElementRef } from '@angular/core';
import { getGroupRank, PlaySudoku } from './lib/PlaySudoku';
import { forEach as _forEach, remove as _remove, values as _values, isEmpty as _isEmpty } from 'lodash';
import { Dictionary } from '@ngrx/entity';
import { Algorithms } from './lib/enums';
import {
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
    const values: Dictionary<boolean> = {};
    g.cells.forEach(c => _isValue(c.value) ? values[c.value] = true : null);
    g.cells.forEach(c => _remove(c.availables, av => values[av] || _isValue(c.value)));
  });
}

const _algorithms: Dictionary<PlayAlgorithm> = {};

const _getAlgorithmInstance = (alg: string): PlayAlgorithm|undefined => {
  switch (alg) {
    case Algorithms.oneCellForValue: return new OneCellForValueAlgorithm();
    case Algorithms.oneValueForCell: return new OneValueForCellAlgorithm();
    case Algorithms.tryNumber: return new TryNumberAlgorithm();
    case Algorithms.twins: return new TwinsAlgorithm();
    default: return undefined;
  }
}

export const getAlgorithms = () => {
  if (_isEmpty(_algorithms)) {
    _values(Algorithms).forEach(alg => _algorithms[alg] = _getAlgorithmInstance(alg))
  }
  return _algorithms;
}
