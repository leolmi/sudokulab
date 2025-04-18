import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  getCellGroups,
  getCellsAvailableMap,
  getGroupCells,
  isEmptyCell,
  SudokuCell
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';
import { keys as _keys } from 'lodash';

export const BUG_ALGORITHM = 'Bug';

/**
 * ALGORITMO BUG
 *
 * - se esiste una sola cella tra quelle ancora da valorizzare che può ospitare 3 valori
 * - e tutte le altre ancora da valorizzare ne possono ospitare solo 2
 * - ed uno dei tre valori è presente solo 2 volte in tutti i gruppi che intersecano la cella
 * allora questo valore può essere escluso dai valori possibili della cella stessa
 *
 * fattore: +160
 */
export class BugAlgorithm extends Algorithm {
  id = BUG_ALGORITHM;
  priority = 5;
  factor = '+160';
  name = 'Bug';
  icon = 'bug_report';
  type = AlgorithmType.support;
  title = `se esiste una sola cella tra quelle ancora da valorizzare che può ospitare 3 valori e tutte le altre solo 2 ed uno dei tre valori
  è presente solo 2 volte in tutti i gruppi che intersecano la cella allora questo può essere escluso dai valori possibili`;
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      const cell = getBugCell(cells);
      if (cell) {
        const value = getCellBugValue(cells, cell);
        if (value) {
          onRemoved(cell, value, (removed) => {
            res.applied = true;
            res.highlights = getHighlights(cell);
            res.descLines = getSingleResultLine(cell,
              `Found ${this.name} on cell ${cell.coord} (the only one with three available values), so [${removed.join(',')}] have been removed from this`);
          })
        }
      }
    });
}


const getBugCell = (cells: SudokuCell[]): SudokuCell|undefined => {
  const tCells: SudokuCell[] = [];
  let hasBug = true;
  cells.forEach((cell) => {
    if (isEmptyCell(cell)) {
      if (cell.available.length === 3) {
        tCells.push(cell);
      } else if (cell.available.length !== 2) {
        hasBug = false;
      }
    }
  });
  if (hasBug && tCells.length !== 1) hasBug = false;
  return hasBug ? tCells[0] : undefined;
}

const getCellBugValue = (cells: SudokuCell[], cell: SudokuCell): string|undefined => {
  const groups = getCellGroups(cell);
  return cell.available.find((v) => {
    // è un bug-value quando in ogni gruppo che interzeca la cella è presente 2 volte
    return !groups.find(g => {
      const m = getCellsAvailableMap(getGroupCells(cells, g))[v];
      return _keys(m).length !== 2;
    });
  });
}


// registra l'algoritmo
registerAlgorithm(new BugAlgorithm());
