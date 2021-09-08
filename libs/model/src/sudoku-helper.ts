import { Sudoku } from './lib/Sudoku';
import { ElementRef } from '@angular/core';
import { cellId, getGroupRank, PlaySudoku } from './lib/PlaySudoku';
import { forEach as _forEach, remove as _remove } from 'lodash';
import { Dictionary } from '@ngrx/entity';
import { PlaySudokuCellAlignment } from './lib/enums';
import {
  AlignmentOnGroupAlgorithm,
  OneCellForValueAlgorithm,
  OneValueForCellAlgorithm,
  TryNumberAlgorithm
} from './lib/Algorithms';
import { PlayAlgorithm } from './lib/Algorithm';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export const use = <T>(o$: Observable<T>, handler: (o:T) => any): any => o$.pipe(take(1)).subscribe(o => handler(o));

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
  if (!ps) return;
  _forEach(ps.groups || {}, (g) => {
    if (!g) return;
    const values: Dictionary<boolean> = {};
    g.cells.forEach(c => _isValue(c.value) ? values[c.value] = true : null);
    g.cells.forEach(c => _remove(c.availables, av => values[av] || _isValue(c.value)));
  });
  _forEach(ps.groups || {}, (g) => {
    if (!g) return;
    g.availableOnCells = {};
    g.cells.forEach(c => {
      c.availables.forEach(av => {
        const avs = `${av}`;
        g.availableOnCells[avs] = g.availableOnCells[avs] || {};
        (g.availableOnCells[avs] || {})[c.id] = true;
      });
    });
  });
  ps.couples = {};
  ps.state.valuesCount = 0;
  ps.state.error = false;
  _forEach(ps.cells || {}, (c) => {
    if (!!c && c.availables.length === 2) {
      const cpid = c.availables.join('|');
      ps.couples[cpid] = ps.couples[cpid] || [];
      (ps.couples[cpid] || []).push(c);
    }
    if (!!c?.value) ps.state.valuesCount++;
    if (!!c) {
      c.error = (c.availables.length < 1 && !c.value);
      if (!!c.error) ps.state.error = true;
    }
  });
  ps.state.percent = ((ps.state.valuesCount - ps.state.fixedCount) / (81 - ps.state.fixedCount)) * 100;
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
  return ['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Enter'].indexOf(direction)>-1;
}
