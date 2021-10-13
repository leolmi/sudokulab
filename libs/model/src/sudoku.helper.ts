import { Sudoku } from './lib/Sudoku';
import { PlaySudoku } from './lib/PlaySudoku';
import {
  cloneDeep as _clone,
  extend as _extend,
  forEach as _forEach,
  includes as _includes,
  intersection as _intersection,
  isArray as _isArray,
  isString as _isString,
  keys as _keys,
  random as _random,
  reduce as _reduce,
  remove as _remove
} from 'lodash';
import { EditSudokuEndGenerationMode, MoveDirection, PlaySudokuCellAlignment, SudokuGroupType } from './lib/enums';
import {
  AlignmentOnGroupAlgorithm,
  OneCellForValueAlgorithm,
  OneValueForCellAlgorithm,
  TRY_NUMBER_ALGORITHM,
  TryNumberAlgorithm
} from './lib/Algorithms';
import { Algorithm } from './lib/Algorithm';
import { CellInfo } from './lib/CellInfo';
import { AVAILABLE_DIRECTIONS, AVAILABLE_VALUES, SUDOKU_DYNAMIC_VALUE, SUDOKU_EMPTY_VALUE } from './lib/consts';
import {
  calcDifficulty,
  EditSudoku,
  EditSudokuCell,
  EditSudokuGenerationMap,
  EditSudokuGroup,
  EditSudokuOptions,
  PlaySudokuGroup,
  SudokuInfo
} from '.';
import { Dictionary } from '@ngrx/entity';
import { SudokuSolution } from './lib/SudokuSolution';
import { getHash } from './global.helper';
import { ElementRef } from '@angular/core';


export const cellId = (column: number, row: number) => `${column}.${row}`;

export const isValue = (v?: string, acceptX = false): boolean => {
  const effv = (v || '').trim();
  return effv !== '' && effv !== SUDOKU_EMPTY_VALUE && (acceptX || v !== SUDOKU_DYNAMIC_VALUE);
}

export const isFixedNotX = (cell: EditSudokuCell, gmap?: EditSudokuGenerationMap): boolean => {
  if (!gmap) return !!cell?.fixed && cell.value !== SUDOKU_DYNAMIC_VALUE;
  return !!cell?.fixed && !gmap.cellsX[cell.id]?.isValueX;
}

export const parseValue = (raw: string, rank?: number, acceptX = false): string => {
  let value = (raw||'').trim();
  if (value === 'Delete' || !isValidValue(value, rank, acceptX)) value = '';
  return value;
}

const _getGroupCellValuesMap = (sdk: PlaySudoku|EditSudoku|undefined, g: PlaySudokuGroup|EditSudokuGroup): Dictionary<string> => {
  return _reduce(g.cells, (m, cid) => {
    const v = cid ? sdk?.cells[cid]?.value : '';
    if (!!cid && !!v && isValue(v)) m[v] = `${m[v] || ''}${cid}`;
    return m;
  }, <Dictionary<string>>{});
}

/**
 * aaplica la regola base del sudoku:
 * - ogni gruppo (riga|colonna|quadrato) deve contenere tutti i numeri da 1-rank senza ripetizioni
 * @param sdk
 * @param resetBefore
 */
export const applySudokuRules = (sdk: PlaySudoku|EditSudoku|undefined, resetBefore = false) => {
  if (!sdk) return;
  const gmap: EditSudokuGenerationMap|undefined = (<EditSudoku>sdk).generationMap;
  if (resetBefore) {
    _forEach(sdk.cells, (c) => c ? c.availables = (isFixedNotX(c, gmap) ? [] : getAvailables(getRank(sdk))) : null);
  }
  _forEach(sdk.groups || {}, (g) => {
    if (!g) return;
    // vettore valori di gruppo
    const values = _getGroupCellValuesMap(sdk, g);
    // elimina da ogni collezione di valori possibili quelli già presenti nel gruppo
    // g.cells.forEach(c => _remove(c.availables, av => !!values[av] && values[av] !== c.id));
    g.cells.forEach(cid => _remove(sdk.cells[cid]?.availables||[], av => av !== sdk.cells[cid]?.value && !!values[av]));
  });
}

export const decodeCellId = (id: string, rank?: number): CellInfo => {
  const parts = (id || '').split('.');
  const col = parseInt(parts[0] || '-1', 10);
  const row = parseInt(parts[1] || '-1', 10);

  const grank = !!rank ? getGroupRank(rank) : 0;
  const gpos = !!grank ? Math.floor(row / grank) * grank + Math.floor(col / grank) : -1;
  return new CellInfo(col, row, gpos);
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

export const getSchemaCellStyle = (rank: number, pxlWidth: number): any => {
  const pxlw = Math.floor(pxlWidth / rank);
  const fnts = Math.floor(pxlw / 2);
  return {
    width: `${pxlw}px`,
    height: `${pxlw}px`,
    'font-size': `${fnts}px`
  }
}

export const getBoardStyle = (ele: ElementRef|undefined): any => {
  return {
    height: `${ele?.nativeElement.clientWidth||600}px`,
  }
}

export const getLinesGroups = (rank: number|undefined): {[id: number]: boolean} => {
  const res: {[id: number]: boolean} = {};
  const grank = getGroupRank(rank||9);
  for(let g = 0; g < (rank||9)-1; g++) {
    res[g] = ((g+1)%grank === 0);
  }
  return res;
}

const _algorithms: Algorithm[] = [];

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

export const getAlgorithm = (code: string): Algorithm|undefined => {
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


export const isSolved = (sdk: PlaySudoku): boolean => {
  return !sdk.state.error && sdk.state.complete;
}

export const getValues = (sdk: PlaySudoku|EditSudoku|undefined): string => {
  let values = '';
  traverseSchema(sdk, (cid) => values = `${values}${sdk?.cells[cid]?.value || SUDOKU_EMPTY_VALUE}`)
  return values;
}

export const loadValues = (sdk: PlaySudoku|undefined, values: string): void => {
  if (!sdk || (values || '').length < getRank(sdk)) return;
  _forEach(sdk.cells, c => {
    const v = values.charAt(c?.position||0);
    if (!!c) c.value = isValue(v) ? v : '';
  });
  applySudokuRules(sdk, true);
}

export const getAvailables = (rank: number|undefined) =>
  Array(rank || 9).fill(0).map((x, i) => `${(i+1)}`);

export const getDimension = (rank: number|undefined) =>
  Array(rank || 9).fill(0).map((x, i) => i)

export const isValidValue = (value: string, rank?: number, acceptX = false): boolean => {
  const mvalue = (value || '').toLowerCase();
  const available_pos = AVAILABLE_VALUES.indexOf(mvalue);
  const isvalue = available_pos > -1 && available_pos < (rank || 9);
  const isdynamic = value === SUDOKU_DYNAMIC_VALUE;
  return (value.length === 1 && (isvalue || (isdynamic && acceptX))) || ['Delete', ' '].indexOf(value)>-1;
}

export const isValidGeneratorValue = (sch: EditSudoku|undefined, value: string): boolean => {
  const mvalue = (value || '').toLowerCase();
  const available_pos = AVAILABLE_VALUES.indexOf(mvalue);
  const isvalue = available_pos > -1 && available_pos < (sch?.options?.rank || 9);
  return (value.length === 1 && isvalue) || ['Delete', SUDOKU_DYNAMIC_VALUE, ' ', '?'].indexOf(value) > -1;
}

export const resetAvailables = (sdk: PlaySudoku|undefined) => {
  _forEach(sdk?.cells||{}, (c) => {
    if (!!c) c.availables = c.fixed ? [] : getAvailables(sdk?.sudoku?.rank);
  });
}

export const toggleValue = (vls: string[], value: string): string[] => {
  const values = _clone(vls);
  const pos = values.indexOf(value);
  if (pos >= 0) {
    values.splice(pos, 1);
    return values;
  }
  values.push(value);
  values.sort();
  return values;
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
  return !!(sdk?.cellList || []).find(cid => sdk?.cells[cid]?.value === SUDOKU_DYNAMIC_VALUE);
}

export const buildSudokuInfo = (sdk: Sudoku, baseinfo?: Partial<SudokuInfo>): SudokuInfo => {
  const info = new SudokuInfo(baseinfo);
  calcDifficulty(info);
  return info;
}

export const getSolutionSudoku = (sol: SudokuSolution, i?: Partial<SudokuInfo>) => {
  const sdk: Sudoku = <Sudoku>_clone(sol.sdk.sudoku);
  const baseinfo = {
    unique: true,
    algorithms: sol.algorithms
  };
  _extend(baseinfo, i || {});
  sdk.info = buildSudokuInfo(sdk, baseinfo);
  return sdk;
}

export const getRandomSchema = (schemas: PlaySudoku[]): PlaySudoku => {
  const tot = (schemas||[]).length;
  const index = _random(0, tot);
  return schemas[index];
}

/**
 * Restituisce l'elenco dei gruppi a cui appartengono contenmporaneamente tutte le celle passate
 * @param sdk
 * @param cids
 */
export const getGroups = (sdk: PlaySudoku, cids: string[]): PlaySudokuGroup[] => {
  const gg: string[][] = [];
  (cids||[]).forEach(cid => {
    const idi = decodeCellId(cid);
    gg.push([
      groupId(SudokuGroupType.row, idi.row),
      groupId(SudokuGroupType.column, idi.col),
      groupId(SudokuGroupType.square, idi.sqr)]);
  });
  const groups = _intersection(...gg);
  return <PlaySudokuGroup[]>groups
    .map(gid => sdk.groups[gid])
    .filter(g => !!g);
}

export const getSudokuForUserSettings = (sdk: PlaySudoku|undefined): Partial<PlaySudoku>|undefined => {
  if (!sdk) return undefined;
  const s = _clone(sdk);
  delete s.sudoku;
  return s;
}
