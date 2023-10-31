import {Sudoku} from './lib/Sudoku';
import {checkSudoku, PlaySudoku} from './lib/PlaySudoku';
import {
  cloneDeep as _clone,
  extend as _extend,
  find as _find,
  forEach as _forEach,
  includes as _includes,
  intersection as _intersection,
  isArray as _isArray,
  isFunction as _isFunction,
  isNumber as _isNumber,
  isObject as _isObject,
  isString as _isString,
  keys as _keys,
  random as _random,
  reduce as _reduce,
  remove as _remove
} from 'lodash';
import {EditSudokuEndGenerationMode, MoveDirection, PlaySudokuCellAlignment, SudokuGroupType} from './lib/enums';
import {getAlgorithms, TRY_NUMBER_ALGORITHM} from './lib/Algorithms';
import {Algorithm} from './lib/Algorithm';
import {CellInfo} from './lib/CellInfo';
import {
  AVAILABLE_DIRECTIONS,
  AVAILABLE_VALUES,
  SUDOKU_DEFAULT_RANK,
  SUDOKU_DYNAMIC_VALUE,
  SUDOKU_EMPTY_VALUE
} from './lib/consts';
import {calcDifficulty} from './lib/logic';
import {Cell} from './lib/Cell';
import {EditSudoku, EditSudokuGenerationMap} from './lib/EditSudoku';
import {EditSudokuCell} from './lib/EditSudokuCell';
import {EditSudokuGroup} from './lib/EditSudokuGroup';
import {EditSudokuOptions} from './lib/EditSudokuOptions';
import {PlaySudokuGroup} from './lib/PlaySudokuGroup';
import {SudokuInfo} from './lib/SudokuInfo';
import {Dictionary} from '@ngrx/entity';
import {SudokuSolution} from './lib/SudokuSolution';
import {calcFixedCount, getHash, isValue} from './global.helper';
import {ElementRef} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {PlaySudokuCell} from "./lib/PlaySudokuCell";
import {PlaySudokuOptions} from "./lib/PlaySudokuOptions";
import {saveAs} from "file-saver";
import {PlaySudokuState} from "./lib/PlaySudokuState";
import {BoardAction} from "./lib/board.model";


export const cellId = (column: number, row: number) => `${column}.${row}`;

/**
 * Vero se la cella è fissa e non dinamica
 * @param cell
 * @param gmap
 */
export const isFixedNotX = (cell: EditSudokuCell, gmap?: EditSudokuGenerationMap): boolean => {
  if (!gmap) return !!cell?.fixed && cell.value !== SUDOKU_DYNAMIC_VALUE;
  return !!cell?.fixed && !gmap.cellsX[cell.id];
}

export const parseValue = (raw: string, rank?: number, acceptX = false): string => {
  let value = (raw||'').trim();
  if (value === 'Delete' || !isValidValue(value, rank, acceptX)) value = '';
  return value;
}

interface GroupValuesMaps {
  v: Dictionary<boolean>;
  f: Dictionary<boolean>;
}

/**
 * Restituisce un doppio dizionario dei valori per gruppo: { v: { [valore]: true }, f: { [valore]: true } } dove:
 * - `v`: individua i valori presenti
 * - `f`: individua i valori fissi presenti
 * @param sdk
 * @param g
 */
const _getGroupCellValuesMaps = (sdk: PlaySudoku|EditSudoku|undefined, g: PlaySudokuGroup|EditSudokuGroup): GroupValuesMaps => {
  return _reduce(g.cells, (gvm, cid) => {
    const cell = sdk?.cells[cid];
    const v = cid ? cell?.value : '';
    if (!!cid && !!v && isValue(v)) {
      gvm.v[v] = true;
      if (cell?.fixed) gvm.f[v] = true;
    }
    return gvm;
  }, <GroupValuesMaps>{ v: {}, f: {}});
}

export interface ResetSchemaOptions {
  simpleFixed?: boolean;
  onlyRealFixed?: boolean;
  allNotValue?: boolean;
  resetBefore?: boolean;
}

/**
 * Tutte le celle non realmente fisse vengono resettate sugli availables (acquisiscono tutti i valori)
 * @param sdk
 * @param o
 */
export const resetAvailable = (sdk: PlaySudoku|EditSudoku|undefined, o?: ResetSchemaOptions) => {
  if (!sdk) return;
  const gmap: EditSudokuGenerationMap|undefined = (<EditSudoku>sdk).generationMap;
  const rank_av = getAvailables(getRank(sdk));
  if (o?.onlyRealFixed) {
    _forEach(sdk.cells, (c) => c ? c.availables = (isFixedNotX(c, gmap) ? [] : _clone(rank_av)) : null);
  } else if (o?.allNotValue) {
    _forEach(sdk.cells, (c) => c ? c.availables = (isValue(c.value) ? [] : _clone(rank_av)) : null);
  } else {
    // ==> o?.simpleFixed
    _forEach(sdk.cells, (c) => c ? c.availables = (c.fixed ? [] : _clone(rank_av)) : null);
  }
}

/**
 * restituisce il dizionario della quantità di numeri per cella,
 * ossia il numero dei valori presenti nel gruppo uguali a quello della cella
 * @param sdk
 * @param g
 */
const _getValuesOnCells = (sdk: PlaySudoku|EditSudoku|undefined, g: PlaySudokuGroup|EditSudokuGroup): Dictionary<number> => {
  const v: Dictionary<number> = {};
  g.cells.forEach(cid => {
    const cell = (sdk?.cells||{})[cid];
    if (cell && cell.value) v[cell.value] = (v[cell.value]||0)+1;
  });
  const voc: Dictionary<number> = {};
  g.cells.forEach(cid => {
    const cell = (sdk?.cells||{})[cid];
    voc[cid] = (cell && cell.value) ? v[cell.value] : 0;
  });
  return voc;
}

/**
 * aaplica la regola base del sudoku:
 * - ogni gruppo (riga|colonna|quadrato) deve contenere tutti i numeri da 1-rank senza ripetizioni
 * @param sdk
 * @param resetBefore
 */
export const applySudokuRules = (sdk: PlaySudoku|EditSudoku|undefined, resetBefore: boolean|ResetSchemaOptions = false) => {
  if (!sdk) return;
  if (resetBefore) {
    const o: ResetSchemaOptions = _isObject(resetBefore) ? resetBefore : { onlyRealFixed: true };
    resetAvailable(sdk, o);
  }
  _forEach(sdk.groups || {}, (g) => {
    if (!g) return;
    // vettore valori di gruppo con tutti i valori reali (quelli numerici)
    // { v1: cid1..cidN, v2:.... }
    const vMaps = _getGroupCellValuesMaps(sdk, g);
    // calcola il numero di valori uguali per cella
    g.valuesOnCells = _getValuesOnCells(sdk, g);
    // elimina da ogni collezione di valori possibili quelli già presenti nel gruppo
    g.cells.forEach(cid => {
      const cell: any = sdk.cells[cid]||{};
      // elimina dagli availables i valori già presenti e diversi dal valore della cella stessa
      _remove(cell.availables||[], (av: string) => (av !== cell.value || !!vMaps.f[av]) && !!vMaps.v[av]);
    });
  });
}

/**
 * Decodifica l'identificativo della cella fornendo un oggetto CellInfo
 * @param id
 * @param rank
 */
export const decodeCellId = (id: string, rank: number = SUDOKU_DEFAULT_RANK): CellInfo => {
  const parts = (id || '').split('.');
  const col = parseInt(parts[0] || '-1', 10);
  const row = parseInt(parts[1] || '-1', 10);

  const grank = !!rank ? getGroupRank(rank) : 0;
  const gpos = !!grank ? Math.floor(row / grank) * grank + Math.floor(col / grank) : -1;
  return new CellInfo(col, row, gpos);
}

export const groupId = (type: SudokuGroupType, pos: number) => `${type}.${pos}`;

export const getGroupRank = (rank: number): number => Math.sqrt(rank||SUDOKU_DEFAULT_RANK);

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
  const grank = getGroupRank(rank||SUDOKU_DEFAULT_RANK);
  for(let g = 0; g < (rank||SUDOKU_DEFAULT_RANK)-1; g++) {
    res[g] = ((g+1)%grank === 0);
  }
  return res;
}

export const getAlgorithmsMap = (exclude: string[] = []): Dictionary<Algorithm> => {
  const algs = getAlgorithms().filter(a => !_includes(exclude, a.id));
  return _reduce(algs, (as, a) => {
    as[a.id] = a;
    return as;
  }, <Dictionary<Algorithm>>{});
};

export const getAlignment = (cid1: string, cid2: string): PlaySudokuCellAlignment => {
  const id1 = cid1.split('.');
  const id2 = cid2.split('.');
  if (id1[0] === id2[0]) return PlaySudokuCellAlignment.vertical;
  if (id1[1] === id2[1]) return PlaySudokuCellAlignment.horizontal;
  return PlaySudokuCellAlignment.none;
}

export const getValuesAlignment = (cids: string[], rank: number|undefined): PlaySudokuCellAlignment => {
  if (cids.length < 2) return PlaySudokuCellAlignment.none;
  let horz = true;
  let vert = true;
  let col = -1;
  let row = -1;
  cids.forEach(id => {
    const cinfo = decodeCellId(id, rank);
    if (col < 0) {
      col = cinfo.col
    } else if (col !== cinfo.col) {
      vert = false;
    }
    if (row < 0) {
      row = cinfo.row;
    } else if (row !== cinfo.row) {
      horz = false;
    }
  });
  if (horz) return PlaySudokuCellAlignment.horizontal;
  if (vert) return PlaySudokuCellAlignment.vertical;
  return PlaySudokuCellAlignment.none;
}

export const getUserCoord = (cid: string): string => {
  const coord = (cid||'').split('.').map(v => parseInt(v));
  const cx = _isNumber(coord[0]) ? coord[0]+1 : coord[0];
  const cy = _isNumber(coord[1]) ? coord[1]+1 : coord[1];
  return `(${cx},${cy})`;
}



export const getRank = (sdk: PlaySudoku|EditSudoku|undefined): number => {
  if (sdk instanceof PlaySudoku) return (<PlaySudoku>sdk).sudoku?.rank || SUDOKU_DEFAULT_RANK;
  return sdk?.options.rank || SUDOKU_DEFAULT_RANK;
}

export const traverseSchema = (sdk: PlaySudoku|EditSudoku|undefined,
                               handler: (cid: string, cell: PlaySudokuCell|EditSudokuCell|undefined) => any) => {
  const rank = getRank(sdk);
  for (let r = 0; r < rank; r++) {
    for (let c = 0; c < rank; c++) {
      const cid = cellId(c, r);
      handler(cid, (sdk?.cells||{})[cid]);
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

export const loadValues = (sdk: PlaySudoku|EditSudoku|undefined, values: string): void => {
  if (!sdk || (values || '').length < getRank(sdk)) return;
  _forEach(sdk.cells, c => {
    const v = values.charAt(c?.position||0);
    if (!!c) c.value = isValue(v, ) ? v : '';
  });
  applySudokuRules(sdk, true);
}

export const loadSchema = (tsdk: PlaySudoku, sdk?: Sudoku): void => {
  if (!sdk) return;
  tsdk.sudoku = sdk;
  tsdk._id = sdk?._id || 0;
  tsdk.state = new PlaySudokuState();
  checkSudoku(tsdk);
}

export const getAvailables = (rank: number|undefined) =>
  Array(rank || SUDOKU_DEFAULT_RANK).fill(0).map((x, i) => `${(i+1)}`);

export const getDimension = (rank: number|undefined) =>
  Array(rank || SUDOKU_DEFAULT_RANK).fill(0).map((x, i) => i)

export const isValidValue = (value: string, rank?: number, acceptX = false): boolean => {
  const mvalue = (value || '').toLowerCase();
  const available_pos = AVAILABLE_VALUES.indexOf(mvalue);
  const isvalue = available_pos > -1 && available_pos < (rank || SUDOKU_DEFAULT_RANK);
  const isdynamic = value === SUDOKU_DYNAMIC_VALUE;
  return (value.length === 1 && (isvalue || (isdynamic && acceptX))) || ['Delete', ' '].indexOf(value)>-1;
}

export const isValidGeneratorValue = (sch: EditSudoku|undefined, value: string): boolean => {
  const mvalue = (value || '').toLowerCase();
  const available_pos = AVAILABLE_VALUES.indexOf(mvalue);
  const isvalue = available_pos > -1 && available_pos < (sch?.options?.rank || SUDOKU_DEFAULT_RANK);
  return (value.length === 1 && isvalue) || ['Delete', SUDOKU_DYNAMIC_VALUE, ' ', '?'].indexOf(value) > -1;
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

export const clearEvent = (e: any) => {
  if (_isFunction(e?.stopPropagation)) e.stopPropagation();
  if (_isFunction(e?.preventDefault)) e.preventDefault();
}

export const geEditFixedCount = (sdk: EditSudoku|undefined): number => {
  let counter = 0;
  _forEach(sdk?.cells||{}, c => (c?.fixed) ? counter++ : null);
  return counter;
}

export const getFixedCount = (sdk: Sudoku|EditSudoku|undefined): number => {
  let counter = 0;
  if (_isArray((<EditSudoku>sdk)?.fixed)) {
    counter = ((<EditSudoku>sdk)?.fixed||[]).length;
  } else if (_isString(sdk?.fixed)) {
    counter = calcFixedCount(sdk?.fixed);
  }
  return counter;
}

export interface SchemaNameOptions {
  separator?: string;
  hideHash?: boolean;
  unknown?: string;
}

export const getTryCount = (sdk: PlaySudoku|Sudoku|undefined): number => {
  const sudoku: Sudoku|undefined = (<PlaySudoku>sdk)?.sudoku||<Sudoku>sdk;
  const trymap: any = (sudoku.info?.difficultyMap||{})[TRY_NUMBER_ALGORITHM];
  if (_isNumber(trymap)) return <number>trymap;
  return _isArray(trymap||[]) ? (trymap||[]).length : 0;
}

export const getDiffCount = (diffMap: Dictionary<number[]|number>, aid: string): number => {
  const algN: any = (diffMap||{})[aid];
  return _isNumber(algN) ? <number>algN : _isArray(algN) ? algN.length : 0;
}

export const getSchemaName = (sdk: PlaySudoku|Sudoku|undefined, o?: SchemaNameOptions): string => {
  const separator = o?.separator||'_';
  const sudoku: Sudoku|undefined = (<PlaySudoku>sdk)?.sudoku||<Sudoku>sdk;
  if (!sudoku) return o?.unknown || 'unknown';
  const rank = sudoku.rank||SUDOKU_DEFAULT_RANK;
  const fixc = getFixedCount(sudoku);
  const hash = o?.hideHash ? '' : `(${getHash(sudoku.fixed)})`;
  const diff = sudoku.info?.difficulty||'' ? `${separator}${sudoku.info?.difficulty}` : '';
  const tryN = getTryCount(sdk);
  const tryd = !!tryN ? `${separator}T${tryN}` : '';
  return `${rank}x${rank}${separator}${fixc}num${diff}${tryd}${separator}${hash}`;
}

export const moveOnDirection = (cid: string, o: Sudoku|EditSudokuOptions|undefined, direction: string): CellInfo|undefined => {
  const info = decodeCellId(cid);
  if (info.row < 0 || info.col < 0) return;
  const rank = o?.rank||SUDOKU_DEFAULT_RANK;
  switch (AVAILABLE_DIRECTIONS[direction]||MoveDirection.next) {
    case MoveDirection.up:
      info.row = (info.row <= 0) ? rank - 1 : info.row - 1;
      break;
    case MoveDirection.down:
      info.row = (info.row >= rank - 1) ? 0 : info.row + 1;
      break;
    case MoveDirection.left:
      info.col = (info.col <= 0) ? rank - 1 : info.col - 1;
      break;
    case MoveDirection.right:
      info.col = (info.col >= rank - 1) ? 0 : info.col + 1;
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
        info.col--;
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
        info.col++;
      }
      break;
  }
  return info;
}


export const hasEndGenerationValue = (o?: PlaySudokuOptions): boolean => {
  return !!o && [EditSudokuEndGenerationMode.afterN, EditSudokuEndGenerationMode.afterTime].indexOf(o.generator.generationEndMode)>-1;
}

export const getMinNumbers = (rank: number|undefined): number => {
  return Math.floor(((rank || SUDOKU_DEFAULT_RANK) * (rank || SUDOKU_DEFAULT_RANK)) / 5);
}

export const getMaxNumbers = (rank: number|undefined): number => {
  return Math.floor(((rank || SUDOKU_DEFAULT_RANK) * (rank || SUDOKU_DEFAULT_RANK)) / 2);
}

export const hasXValues = (sdk: PlaySudoku|EditSudoku|undefined): boolean => {
  return !!_find(sdk?.cells || [], (cid: string) =>
    (sdk?.cells || {})[cid]?.value === SUDOKU_DYNAMIC_VALUE);
}

export const buildSudokuInfo = (sdk: Sudoku, baseinfo?: Partial<SudokuInfo>, deleteCases = false): SudokuInfo => {
  const info = new SudokuInfo(baseinfo);
  info.rank = sdk.rank || info.rank;
  info.fixedCount = getFixedCount(sdk);
  calcDifficulty(info);
  if (deleteCases) (info.algorithms || []).forEach(a => a.cases = []);
  return info;
}

export const getSolutionSudoku = (sol?: SudokuSolution, i?: Partial<SudokuInfo>) => {
  if (!sol) return undefined;
  const sdk: Sudoku = <Sudoku>_clone(sol.sdk.sudoku);
  const baseinfo = {
    unique: true,
    algorithms: sol.algorithms,
  };
  _extend(baseinfo, i || {});
  sdk.info = buildSudokuInfo(sdk, baseinfo, true);
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

/**
 * Restituisce l'elenco dei gruppi a cui appartengono almeno una delle celle passate
 * @param sdk
 * @param cids
 */
export const getAllGroups = (sdk: PlaySudoku, cids: string[]): PlaySudokuGroup[] => {
  const gids: any = {};
  (cids||[]).forEach(cid => {
    const idi = decodeCellId(cid);
    gids[groupId(SudokuGroupType.row, idi.row)] = true;
    gids[groupId(SudokuGroupType.column, idi.col)] = true;
    gids[groupId(SudokuGroupType.square, idi.sqr)] = true;
  });
  return <PlaySudokuGroup[]>_keys(gids)
    .map(gid => sdk.groups[gid])
    .filter(g => !!g);
}

export const isTheSame = (i1: CellInfo, i2: CellInfo): boolean => {
  return i1.col === i2.col && i1.row === i2.row && i1.sqr === i2.sqr;
}

export const canView = (i1: CellInfo, i2: CellInfo): boolean => {
  return i1.col === i2.col || i1.row === i2.row || i1.sqr === i2.sqr && !isTheSame(i1, i2);
}

/**
 * restituisce tutte le celle non valorizzate che "vedono" contemporaneamente tutte quelle passate
 * @param sdk
 * @param cids
 */
export const getByVisibles = (sdk: PlaySudoku, cids: string[]): PlaySudokuCell[] => {
  const infos = cids.map(cid => decodeCellId(cid));
  const excl: any = _reduce(cids, (x, cid) => ({...x, [cid]: true}), {});
  const res: any = {};
  const rescell: PlaySudokuCell[] = [];
  traverseSchema(sdk, (cid, cell) => {
    if (!parseValue(cell?.value||'')) {
      const info = decodeCellId(cid);
      if (!infos.find(i => !canView(info, i)) && !excl[cid]) {
        // console.log('la cella', cid, 'può "vedere" contemporaneamente', cids);
        if (!res[cid]) rescell.push(<PlaySudokuCell>cell);
        res[cid] = true;
      }
    }
  });
  return rescell;
}

export const getSudokuForUserSettings = (sdk: PlaySudoku|undefined): Partial<PlaySudoku>|undefined => {
  if (!sdk) return undefined;
  const s = _clone(sdk);
  delete s.sudoku;
  return s;
}

const setCellFixedValue = (sdk: Sudoku, cell: Cell) => {
  const cid = decodeCellId(cell.id);
  const index = (cid.row * sdk.rank) + cid.col;
  const char = parseValue(cell.value, sdk.rank)||SUDOKU_EMPTY_VALUE;
  sdk.fixed = sdk.fixed.substr(0, index) + char + sdk.fixed.substr(index+1);
  sdk.values = sdk.fixed;
}

export const updateSudokuCellValue = (sudoku$: BehaviorSubject<Sudoku>, cell: Cell): Sudoku => {
  const sdk = sudoku$.getValue();
  const nsdk = _clone(sdk);
  setCellFixedValue(nsdk, cell);
  sudoku$.next(nsdk);
  return nsdk;
}

export const getSudokuCells = (sdk: Sudoku): Dictionary<Cell> => {
  const cells: Dictionary<Cell> = {};
  if(!!sdk) {
    for (let col = 0; col < sdk.rank; col++) {
      for (let row = 0; row < sdk.rank; row++) {
        const index = (row * sdk.rank) + col;
        const v = parseValue(sdk.fixed.charAt(index), sdk.rank, true);
        cells[cellId(col, row)] = {
          id: cellId(col, row),
          value: v,
          fixed: !!v
        }
      }
    }
  }
  return cells;
}

export interface CheckImportTextOptions {
  rank?: number;
  partial?: boolean;
}

export const checkImportText = (txt: string, o?: CheckImportTextOptions): string => {
  const rank = o?.rank || SUDOKU_DEFAULT_RANK;
  const dim = rank * rank;
  txt = (txt || '')
    .replace(/\s/g, '')
    .replace(/[^x0123456789]/g, '');
  if (o?.partial) return txt.length <= dim ? txt : '';
  return txt.length === dim ? txt : '';
}

export const isPencilEmpty = (cells: Dictionary<Cell>): boolean => {
  let pencil = false;
  _forEach(cells, (c) => ((<PlaySudokuCell>c)?.pencil || []).length > 0 ? pencil = true : null);
  return !pencil;
}

export const dowloadSchema = (sdk: PlaySudoku) => {
  const schema: Sudoku = new Sudoku({
    fixed: sdk?.sudoku?.fixed || '',
    info: new SudokuInfo(sdk?.sudoku?.info)
  });
  const filename = getSchemaName(schema);
  const schema_str = JSON.stringify(schema, null, 2);
  const blob = new Blob([schema_str], { type: "application/json;" });
  saveAs(blob, `${filename}.json`);
}

export const getLabCodeAction = (labCode: string): BoardAction|undefined => {
  return (/^lab\./g.test(labCode)) ? <BoardAction>(labCode.substring(4)) : undefined;
}
