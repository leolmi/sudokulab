import {
  Algorithm,
  AlgorithmResult,
  AlgorithmResultLine, CELL_GROUP_TYPE,
  cellId, CellInfo,
  checkAvailable,
  decodeCellId, decodeGroupId,
  getGroups,
  getGroupsByType,
  getUserCoord,
  groupId,
  PlaySudoku,
  PlaySudokuCell,
  PlaySudokuGroup,
  SUDOKU_DEFAULT_RANK,
  SudokuGroupType
} from "@sudokulab/model";
import {Dictionary} from "@ngrx/entity";
import {keys as _keys, reduce as _reduce, values as _values} from 'lodash';

/**
 * Opzioni per il metodo applyAlgorithm
 */
export interface ApplyAlgorithmOptions {
  done: Dictionary<boolean>;
  applied: boolean;
  descLines: AlgorithmResultLine[];
  doCheckAvailable: boolean;
  cells: Dictionary<boolean>;
  values: string|undefined;
  value: string|undefined;
  cases: PlaySudoku[];
}

/**
 * Applica l'algoritmo aggiornando i valori possibili e gestendo il risultato
 * @param alg
 * @param sdk
 * @param handler
 */
export const applyAlgorithm = (alg: Algorithm, sdk: PlaySudoku, handler: (o: ApplyAlgorithmOptions) => void): AlgorithmResult => {
  const o = <ApplyAlgorithmOptions>{
    done: {},
    doCheckAvailable: true,
    // >> AlgorithmResult
    applied: false,
    descLines: [],
    cells: {},
    values: undefined,
    value: undefined,
    cases: []
  }

  handler(o);

  if (o.applied && o.doCheckAvailable) checkAvailable(sdk);

  return new AlgorithmResult({
    algorithm: alg.id,
    applied: o.applied,
    descLines: o.descLines,
    cells: _keys(o.cells),
    values: o.values,
    value: o.value,
    cases: o.cases
  }, sdk);
}

/**
 * cicla i gruppi del tipo (default=row) passato (0 -> rank)
 * @param sdk
 * @param types
 * @param handler
 */
export const onGroupsByType = (sdk: PlaySudoku, types: SudokuGroupType[], handler: (group: PlaySudokuGroup) => any) => {
  const rank = sdk.sudoku?.rank || SUDOKU_DEFAULT_RANK;
  for (const type of types) {
    for (let pos = 0; pos < rank; pos++) {
      const gid = groupId(type, pos);
      const group = sdk.groups[gid];
      if (group) handler(group);
    }
  }
}

export const onRank = (sdk: PlaySudoku, handler: (pos: number) => any) => {
  const rank = sdk.sudoku?.rank || SUDOKU_DEFAULT_RANK;
  for (let r = 0; r < rank; r++) {
    handler(r);
  }
}

/**
 * cicla tutte le celle dello schema
 * @param sdk
 * @param handler
 * @param exclude
 */
export const onCells = (sdk: PlaySudoku, handler: (cell: PlaySudokuCell) => any, exclude?: PlaySudokuCell[]) => {
  const rank = sdk.sudoku?.rank || SUDOKU_DEFAULT_RANK;
  const exc = (exclude||[]).map(x => x.id);
  for (let r = 0; r < rank; r++) {
    for (let c = 0; c < rank; c++) {
      const cell = sdk.cells[cellId(c, r)];
      if (cell && !exc.includes(cell.id)) handler(cell);
    }
  }
}

/**
 * vero se è una cella non valorizzata che contiene n (default=2) possibili valori
 * @param cell
 * @param n
 */
export const hasNAvailable = (cell: PlaySudokuCell|undefined|null, n = 2): boolean => {
  return !!cell && !cell.value && !cell.fixed && cell.availables.length === n;
}

export const hasThisAvailable = (cell: PlaySudokuCell|undefined|null, v: string): boolean => {
  return !!cell && !!v && !cell.value && !cell.fixed && cell.availables.includes(v);
}


/**
 * Trova tutte le celle influenzate da una cella (stessa riga, colonna o box)
 * @param sdk
 * @param c
 */
export const findAffectedCells = (sdk: PlaySudoku, c: PlaySudokuCell): PlaySudokuCell[] => {
  const groups = getGroups(sdk, [c.id]);
  const affected: PlaySudokuCell[] = [];
  groups.forEach(g => {
    g.cells.forEach(cid => {
      if (cid !== c.id) affected.push(c);
    });
  })
  return affected;
}

export const findCommonAffectedCells = (sdk: PlaySudoku, c1: PlaySudokuCell, c2: PlaySudokuCell): PlaySudokuCell[] => {
  const affected1 = findAffectedCells(sdk, c1);
  const affected2 = findAffectedCells(sdk, c2);

  return affected1.filter(cell => {
    const info1 = decodeCellId(cell.id);
    return affected2.some(c => {
      const info = decodeCellId(c.id);
      return info.row === info1.row && info.col === info1.col;
    })
  });
}

export interface CellPosition {
  cell: PlaySudokuCell;
  info: CellInfo;
  index: number;
  owner?: string;
}

export interface CouplePositionN {
  gIndex: number;
  cp1: CellPosition;
  cp2: CellPosition;
}

/**
 * celle di un gruppo che rispondono ai filtri di valore per cui sono calcolate
 */
export interface ValuePositions {
  gIndex: number;
  gid: string;
  cp1: CellPosition;
  cp2: CellPosition;
  cp3: CellPosition;
  cp4: CellPosition;
  cp5: CellPosition;
  cp6: CellPosition;
  cp7: CellPosition;
  cp8: CellPosition;
  cp9: CellPosition;
}


/**
 * restituisce l'elenco delle celle che contengono il valore e la loro posizione
 * @param sdk
 * @param g
 * @param v
 */
const getCellPositions = (sdk: PlaySudoku, g: PlaySudokuGroup, v: string): CellPosition[] => {
  const positions: CellPosition[] = [];
  g.cells.forEach((cid, index) => {
    const cell = sdk.cells[cid];
    const info = decodeCellId(cid);
    if (cell && hasThisAvailable(cell, v)) {
      positions.push({ index, cell, info, owner: g.id });
    }
  });
  return positions;
}

/**
 * restituisce l'elenco dei gruppi comuni
 * @param cp1
 * @param cp2
 * @return string[]  elenco degli id di gruppo
 */
export const getCommonGroupIds = (cp1: CellPosition, cp2: CellPosition): string[] => {
  return _reduce(['col', 'row', 'sqr'], (groups, type) =>
    ((<any>cp1.info)[type] === (<any>cp2.info)[type]) ?
      [...groups, groupId(CELL_GROUP_TYPE[type], (<any>cp1.info)[type])] :
      groups, <string[]>[]);
}

/**
 * restituisce l'identificativo del gruppo ortogonale a quelli dati (ossia un terzo che li comprende entrambi)
 * @param cp1
 * @param cp2
 */
export const getOrthogonalCommonGroup = (cp1: CellPosition, cp2: CellPosition): string|undefined => {
  const orthogonalType = ['col', 'row', 'sqr'].find(type => {
    const typePos1: number = (<any>cp1.info)[type];
    const typePos2: number = (<any>cp1.info)[type];
    const gid = groupId(CELL_GROUP_TYPE[type], typePos1);
    return typePos1 === typePos2 && cp1.owner !== cp2.owner && cp1.owner !== gid && cp2.owner !== gid;
  });
  if (orthogonalType) {
    const orthogonalPos: number = (<any>cp1.info)[orthogonalType];
    return groupId(CELL_GROUP_TYPE[orthogonalType], orthogonalPos);
  }
  return undefined;
}

const _getNValueGroups = (sdk: PlaySudoku, groups: PlaySudokuGroup[], value: string, filter: (positions: CellPosition[]) => boolean): ValuePositions[] => {
  return groups
    .map((g, gIndex) => ({
      gIndex,
      gid: g!.id,
      nPositions: getCellPositions(sdk, g, value),
    }))
    .filter(gps => filter(gps.nPositions))
    .map(gps => _reduce(gps.nPositions, (vp, p, i) =>
      ({...vp, [`cp${(i + 1)}`]: p}), <ValuePositions>{gIndex: gps.gIndex, gid: gps.gid}));
}

/**
 * Trova tutti i gruppi (type) in cui il candidato appare solo N volte
 * @param sdk
 * @param type
 * @param value
 * @param filter
 */
export const getNValueGroups = (sdk: PlaySudoku, type: SudokuGroupType, value: string, filter: (positions: CellPosition[]) => boolean): ValuePositions[] => {
  const groups = getGroupsByType(sdk, type);
  // Trova tutti i gruppi (type) in cui il candidato appare solo 2 volte
  return _getNValueGroups(sdk, groups, value, filter);
}

/**
 * restituisce tutti i gruppi che contengono il valore secondo le regole di filter
 * @param sdk
 * @param value
 * @param filter
 * @param gTypes
 */
export const getNValuesGroups = (sdk: PlaySudoku, value: string, filter: (positions: CellPosition[]) => boolean): ValuePositions[] => {
  return _getNValueGroups(sdk, <PlaySudokuGroup[]>_values(sdk.groups), value, filter);
}


export interface NotifyAppliedArgs {
  cid: string;
  removed: string[];
  cids?: string[];
  gids?: string[];
  desc?: string;
  skipRemovedCheck?: boolean;
}

export const notifyApplied = (alg: Algorithm, o: ApplyAlgorithmOptions, args: NotifyAppliedArgs) => {
  if (!args.skipRemovedCheck && args.removed.length < 1) return;
  o.applied = true;
  o.descLines.push(new AlgorithmResultLine({
    cell: args.cid,
    others: args.cids||[],
    groups: args.gids||[],
    description: args.desc || `Found ${alg.name} on cells ${(args.cids||[]).map(tid => getUserCoord(tid)).join(' ')},
so [${args.removed.join(',')}] have been removed on ${getUserCoord(args.cid)}`
  }));
}

