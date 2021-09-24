import { Sudoku } from './lib/Sudoku';
import { ElementRef } from '@angular/core';
import { PlaySudoku } from './lib/PlaySudoku';
import {
  cloneDeep as _clone,
  extend as _extend,
  forEach as _forEach,
  includes as _includes,
  isString as _isString,
  isArray as _isArray,
  keys as _keys,
  remove as _remove,
  reduce as _reduce
} from 'lodash';
import { EditSudokuEndGenerationMode, MoveDirection, PlaySudokuCellAlignment, SudokuGroupType } from './lib/enums';
import {
  AlignmentOnGroupAlgorithm,
  OneCellForValueAlgorithm,
  OneValueForCellAlgorithm,
  TRY_NUMBER_ALGORITHM,
  TryNumberAlgorithm
} from './lib/Algorithms';
import { PlayAlgorithm } from './lib/Algorithm';
import { BehaviorSubject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { CellInfo } from './lib/CellInfo';
import { AVAILABLE_DIRECTIONS, AVAILABLE_VALUES, SUDOKU_DYNAMIC_VALUE, SUDOKU_EMPTY_VALUE } from './lib/consts';
import { calcDifficulty, EditSudoku, EditSudokuOptions, SudokuInfo } from '.';
import { Dictionary } from '@ngrx/entity';
import { SudokuSolution } from './lib/SudokuSolution';

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

export const update = <T>(o: T, chs?: Partial<T>, handler?: (c:T) => void): T => {
  const co = <T>_clone(o||{});
  if (!!chs) _extend(co, chs||{});
  if (!!handler) handler(co);
  return co;
}

export const updateBehaviorSubject = <T>(bs$: BehaviorSubject<T>, handler: (c: T) => boolean): void =>
  use(bs$, o => {
    const co = _clone(o);
    if (handler(co)) bs$.next(co);
  });

export const cellId = (column: number, row: number) => `${column}.${row}`;

export const isValue = (v: string, acceptX = false): boolean => {
  const effv = (v || '').trim();
  return effv !== '' && effv !== SUDOKU_EMPTY_VALUE && (acceptX || v !== SUDOKU_DYNAMIC_VALUE);
}

/**
 * aaplica la regola base del sudoku:
 * - ogni gruppo (riga|colonna|quadrato) deve contenere tutti i numeri da 1-rank senza ripetizioni
 * @param sdk
 */
export const applySudokuRules = (sdk: PlaySudoku|EditSudoku|undefined) => {
  if (!sdk) return;
  _forEach(sdk.groups || {}, (g) => {
    if (!g) return;
    // vettore valori di gruppo
    const values: Dictionary<string> = {};
    g.cells.forEach(c => isValue(c.value) ? values[c.value] = c.id : null);
    // elimina da ogni collezione di valori possibili quelli già presenti nel gruppo
    g.cells.forEach(c => _remove(c.availables, av => !!values[av] && values[av] !== c.id));
  });
}

export const decodeCellId = (id: string): CellInfo => {
  const parts = (id || '').split('.');
  return new CellInfo(parseInt(parts[0] || '-1', 10), parseInt(parts[1] || '-1'));
}

export const groupId = (type: SudokuGroupType, pos: number) => `${type}.${pos}`;

export const getGroupRank = (rank: number): number => Math.sqrt(rank||9);

export const getCellStyle = (sdk: Sudoku|EditSudokuOptions|undefined, ele: HTMLElement, size = 40): any => {
  const pxlw = sdk ? Math.floor(ele.clientWidth / sdk.rank) : size;
  const pxlh = sdk ? Math.floor(ele.clientHeight / sdk.rank) : size;
  const mindim = Math.min(pxlw, pxlh);
  const fnts = sdk ? Math.floor(mindim / 2) : (size / 2);
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

export const getRank = (sdk: PlaySudoku|EditSudoku|undefined): number => {
  if (sdk instanceof PlaySudoku) return (<PlaySudoku>sdk).sudoku?.rank || 9;
  return sdk?.options.rank || 9;
}

export const traverseSchema = (sdk: PlaySudoku|EditSudoku|undefined, handler: (cid: string) => any) => {
  const rank = getRank(sdk);
  for (let r = 0; r < rank; r++) {
    for (let c = 0; c < rank; c++) {
      handler(cellId(c, r));
    }
  }
}

export const getValues = (sdk: PlaySudoku|EditSudoku|undefined): string => {
  let values = '';
  traverseSchema(sdk, (cid) => values = `${values}${sdk?.cells[cid]?.value || SUDOKU_EMPTY_VALUE}`)
  return values;
}

export const getAvailables = (rank: number|undefined) =>
  Array(rank || 9).fill(0).map((x, i) => `${(i+1)}`);

export const getDimension = (rank: number|undefined) =>
  Array(rank || 9).fill(0).map((x, i) => i)

export const isValidValue = (sdk: PlaySudoku|undefined, value: string): boolean => {
  const mvalue = (value || '').toLowerCase();
  const available_pos = AVAILABLE_VALUES.indexOf(mvalue);
  const isvalue = available_pos > -1 && available_pos < (sdk?.sudoku?.rank || 9);
  return (value.length === 1 && isvalue) || ['Delete', ' '].indexOf(value)>-1;
}

export const isValidGeneratorValue = (sch: EditSudoku|undefined, value: string): boolean => {
  const mvalue = (value || '').toLowerCase();
  const available_pos = AVAILABLE_VALUES.indexOf(mvalue);
  const isvalue = available_pos > -1 && available_pos < (sch?.options?.rank || 9);
  return (value.length === 1 && isvalue) || ['Delete', SUDOKU_DYNAMIC_VALUE, ' ', '?'].indexOf(value) > -1;
}

export const resetAvailables = (sdk: PlaySudoku|undefined) => {
  _forEach(sdk?.cells||{}, (c) => {
    if (!!c) c.availables = c.value ? [] : getAvailables(sdk?.sudoku?.rank);
  });
}

export const isDirectionKey = (direction: string): boolean => {
  return _keys(AVAILABLE_DIRECTIONS).indexOf(direction)>-1;
}

export const geEditFixedCount = (sdk: EditSudoku|undefined): number => {
  let counter = 0;
  _forEach(sdk?.cells||{}, c => (c?.fixed) ? counter++ : null);
  return counter;
}

export const getFixedCount = (sdk: Sudoku|EditSudoku|undefined): number => {
  let counter = 0;
  if (_isArray((<EditSudoku>sdk)?.cellList)) {
    counter = ((<EditSudoku>sdk)?.cellList||[]).filter((c: any) => !!c?.fixed).length;
  } else if (_isString(sdk?.fixed)) {
    _forEach((sdk?.fixed || ''), (v) => isValue(v) ? counter++ : null);
  }
  return counter;
}

export interface SchemaNameOptions {
  separator?: string;
  hideHash?: boolean;
  unknown?: string;
}

export const getSchemaName = (sdk: PlaySudoku|Sudoku|undefined, o?: SchemaNameOptions): string => {
  const separator = o?.separator||'_';
  const sudoku: Sudoku|undefined = (<PlaySudoku>sdk)?.sudoku||<Sudoku>sdk;
  if (!sudoku) return o?.unknown || 'unknown';
  const rank = sudoku.rank||9;
  const fixc = getFixedCount(sudoku);
  const hash = o?.hideHash ? '' : `(${getHash(sudoku.fixed)})`;
  const diff = sudoku.info?.difficulty||'' ? `${separator}${sudoku.info?.difficulty}` : '';
  const tryN = (sudoku.info?.difficultyMap||{})[TRY_NUMBER_ALGORITHM];
  const tryd = !!tryN ? `${separator}T${tryN}` : '';
  return `${rank}x${rank}${separator}${fixc}num${diff}${tryd}${separator}${hash}`;
}

export const moveOnDirection = (cid: string, o: Sudoku|EditSudokuOptions|undefined, direction: string): CellInfo|undefined => {
  const info = decodeCellId(cid);
  if (info.row < 0 || info.col < 0) return;
  const rank = o?.rank||9;
  switch (AVAILABLE_DIRECTIONS[direction]||MoveDirection.next) {
    case MoveDirection.up:
      if (info.row <= 0) return;
      info.row--;
      break;
    case MoveDirection.down:
      if (info.row >= rank - 1) return;
      info.row++;
      break;
    case MoveDirection.left:
      if (info.col <= 0) return;
      info.col--;
      break;
    case MoveDirection.right:
      if (info.col >= rank - 1) return;
      info.col++;
      break;
    case MoveDirection.prev:
      if (info.col <= 0) {
        if (info.row <= 0) {
          info.col = rank - 1;
          info.row = rank - 1;
        } else {
          info.row--;
          info.col = rank - 1;
        }
      } else {
        info.col --;
      }
      break;
    case MoveDirection.next:
    default:
      if (info.col >= rank - 1) {
        if (info.row >= rank - 1) {
          info.col = 0;
          info.row = 0;
        } else {
          info.row++;
          info.col = 0;
        }
      } else {
        info.col ++;
      }
      break;
  }
  return info;
}


export const hasEndGenerationValue = (o?: EditSudokuOptions): boolean => {
  return !!o && [EditSudokuEndGenerationMode.afterN, EditSudokuEndGenerationMode.afterTime].indexOf(o.generationEndMode)>-1;
}

export const getMinNumbers = (rank: number|undefined): number => {
  return Math.floor(((rank || 9) * (rank || 9)) / 5);
}

export const getMaxNumbers = (rank: number|undefined): number => {
  return Math.floor(((rank || 9) * (rank || 9)) / 2);
}

export const hasXValues = (sdk: EditSudoku|undefined): boolean => {
  return !!(sdk?.cellList || []).find(c => c.value === SUDOKU_DYNAMIC_VALUE);
}

export const buildSudokuInfo = (sdk: Sudoku, baseinfo?: Partial<SudokuInfo>): SudokuInfo => {
  const info = new SudokuInfo(baseinfo);
  calcDifficulty(info);
  return info;
}

export const getSolutionSudoku = (sol: SudokuSolution) => {
  const sdk: Sudoku = <Sudoku>_clone(sol.sdk.sudoku);
  sdk.info = buildSudokuInfo(sdk, { unique: true, algorithms: sol.algorithms });
  return sdk;
}
