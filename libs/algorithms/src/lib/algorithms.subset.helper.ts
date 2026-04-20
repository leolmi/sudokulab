import {
  AlgorithmResult,
  findGroup,
  getCellsAvailableMap,
  getCoords,
  groupCoord,
  GroupType,
  isEmptyCell,
  SudokuCell,
  SudokuGroup
} from '@olmi/model';
import { getHighlights, getSingleResultLine, onRemoved } from './algorithms.common';
import { keys as _keys, union as _union } from 'lodash';

/**
 * genera tutte le combinazioni di N elementi da un array
 */
const combinations = <T>(arr: T[], n: number): T[][] => {
  if (n <= 0 || n > arr.length) return [];
  if (n === arr.length) return [arr.slice()];
  if (n === 1) return arr.map(x => [x]);
  const out: T[][] = [];
  for (let i = 0; i <= arr.length - n; i++) {
    const head = arr[i];
    for (const tail of combinations(arr.slice(i + 1), n - 1)) out.push([head, ...tail]);
  }
  return out;
}

/**
 * Naked Subset di dimensione N:
 * in un gruppo esistono esattamente N celle ognuna con *al più* N candidati
 * il cui set di candidati **unione** ha esattamente N valori → quei valori
 * possono essere rimossi dalle altre celle del gruppo.
 *
 * Per N=2 equivale a naked pair (Twins), per N=3 naked triple, per N=4 naked quad.
 */
export const applyNakedSubset = (
  alg: { name: string },
  cells: SudokuCell[],
  res: AlgorithmResult,
  N: number
): void => {
  findGroup(cells, (gcells, g) => {
    const candidates = gcells.filter(c => isEmptyCell(c) && c.available.length >= 2 && c.available.length <= N);
    if (candidates.length < N) return res.applied;
    for (const combo of combinations(candidates, N)) {
      const unionVals = _union(...combo.map(c => c.available));
      if (unionVals.length !== N) continue;
      const comboIds = combo.map(c => c.id);
      // rimuove i valori unionVals dalle altre celle del gruppo
      const others = gcells.filter(c => isEmptyCell(c) && !comboIds.includes(c.id));
      for (const oc of others) {
        onRemoved(oc, (v) => unionVals.includes(v), (removed) => {
          res.applied = true;
          res.highlights = getHighlights(oc, comboIds, [g]);
          res.descLines = getSingleResultLine(oc,
            `Found ${alg.name} [${unionVals.join(',')}] in group ${groupCoord(g)} on cells ${getCoords(comboIds)}, so on cell ${oc.coord} the values [${removed.join(',')}] have been removed`);
        });
        if (res.applied) return true;
      }
    }
    return res.applied;
  });
}

/**
 * Hidden Subset di dimensione N:
 * in un gruppo esistono esattamente N valori i cui possibili posizionamenti
 * sono confinati nelle stesse N celle → da quelle celle possono essere
 * rimossi tutti gli altri candidati.
 *
 * Per N=2 hidden pair, N=3 hidden triple, N=4 hidden quad.
 */
export const applyHiddenSubset = (
  alg: { name: string },
  cells: SudokuCell[],
  res: AlgorithmResult,
  N: number
): void => {
  findGroup(cells, (gcells, g) => {
    const vmap = getCellsAvailableMap(gcells);
    // valori con al più N posizioni possibili (e almeno 2)
    const eligibleValues = _keys(vmap).filter(v => {
      const k = _keys(vmap[v]).length;
      return k >= 2 && k <= N;
    });
    if (eligibleValues.length < N) return res.applied;
    for (const combo of combinations(eligibleValues, N)) {
      const unionIds = _union(...combo.map(v => _keys(vmap[v])));
      if (unionIds.length !== N) continue;
      // le N celle contengono solo i valori di combo + eventuali altri da rimuovere
      const subsetCells = gcells.filter(c => unionIds.includes(c.id));
      for (const sc of subsetCells) {
        onRemoved(sc, (v) => !combo.includes(v), (removed) => {
          res.applied = true;
          res.highlights = getHighlights(sc, unionIds, [g]);
          res.descLines = getSingleResultLine(sc,
            `Found ${alg.name} [${combo.join(',')}] in group ${groupCoord(g)} on cells ${getCoords(unionIds)}, so on cell ${sc.coord} the values [${removed.join(',')}] have been removed`);
        });
        if (res.applied) return true;
      }
    }
    return res.applied;
  });
}

/**
 * Fish di dimensione N (N=2 X-Wing, N=3 Swordfish, N=4 Jellyfish):
 * N righe (o colonne) in cui un valore V compare solo in posizioni appartenenti
 * a N colonne (o righe) comuni → V può essere rimosso dalle altre celle di
 * quelle N colonne (o righe).
 */
export const applyFish = (
  alg: { name: string },
  cells: SudokuCell[],
  res: AlgorithmResult,
  N: number,
  baseType: GroupType.row | GroupType.column
): void => {
  const coverType = baseType === GroupType.row ? GroupType.column : GroupType.row;
  // ricava tutti i gruppi base
  const baseGroups: { group: SudokuGroup; gcells: SudokuCell[] }[] = [];
  findGroup(cells, (gcells, g) => {
    if (g.type === baseType) baseGroups.push({ group: g, gcells });
    return false;
  });
  // raccoglie per ogni valore gli indici base -> coverIndices
  for (let n = 1; n <= 9; n++) {
    const value = `${n}`;
    const basesForValue: { baseIdx: number; coverIdx: number[]; cellIds: string[] }[] = [];
    baseGroups.forEach((b, i) => {
      const cellsWithV = b.gcells.filter(c => isEmptyCell(c) && c.available.includes(value));
      if (cellsWithV.length >= 2 && cellsWithV.length <= N) {
        const coverIdx = cellsWithV.map(c => baseType === GroupType.row ? c.col : c.row);
        basesForValue.push({ baseIdx: i, coverIdx, cellIds: cellsWithV.map(c => c.id) });
      }
    });
    if (basesForValue.length < N) continue;
    for (const combo of combinations(basesForValue, N)) {
      const coverUnion = _union(...combo.map(c => c.coverIdx));
      if (coverUnion.length !== N) continue;
      const comboCellIds = _union(...combo.map(c => c.cellIds));
      const baseIdxSet = new Set(combo.map(c => c.baseIdx));
      // rimuove value dalle celle delle cover groups non appartenenti alle base
      for (const coverPos of coverUnion) {
        const coverCells = cells.filter(c => (coverType === GroupType.row ? c.row : c.col) === coverPos);
        for (const cc of coverCells) {
          const ccBaseIdx = baseType === GroupType.row ? cc.row : cc.col;
          if (baseIdxSet.has(ccBaseIdx)) continue;
          if (!isEmptyCell(cc)) continue;
          onRemoved(cc, value, (removed) => {
            res.applied = true;
            res.highlights = getHighlights(cc, comboCellIds);
            res.descLines = getSingleResultLine(cc,
              `Found ${alg.name} for value "${value}" on ${baseType}s ${combo.map(c => c.baseIdx + 1).join(',')}, so on cell ${cc.coord} the value [${removed.join(',')}] has been removed`);
          });
          if (res.applied) return;
        }
      }
    }
  }
}

