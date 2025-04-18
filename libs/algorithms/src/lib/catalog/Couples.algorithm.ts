import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  findGroup,
  getCellGroups,
  getCommonGroups,
  getGroupCells,
  isTheSameCell,
  isTheSameGroup,
  SudokuCell,
  SudokuGroup
} from '@olmi/model';
import { intersection as _intersection, isEqual as _isEqual, xor as _xor } from 'lodash';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';

export const COUPLES_ALGORITHM = 'Couples';


/**
 * ALGORITMO DELLE COPPIE
 *
 * esclude valori in celle risultanti dall'incrocio di coppie presenti in altri gruppi.
 *
 *      XY ---- YZ             XY ---- YZ
 *      |            oppure            |
 *      |                              |
 *      XZ      -Z            -X       ZX
 *
 * fattore: +150
 */
export class CouplesAlgorithm extends Algorithm {
  id = COUPLES_ALGORITHM;
  priority = 4;
  factor = '+150';
  name = 'Couples over groups';
  icon = 'move_down';
  type = AlgorithmType.support;
  title = `quando coppie di valori producono allineamenti su uno dei valori possono far si che sia possibile escludere un valore da celle eserne ai gruppi considerati`;
  description = 'Abbastanza complesso non risolve un valore di una cella ma contribuisce con i precedenti';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      findGroup(cells, (gcells, g_XYZ) => {
        return !!gcells.find((cell_XY) => {
          // la prima cella deve poter contenere 2 possibili valori
          // cella sinistra (XY)
          if (cell_XY.available.length===2) {
            // ricerca una seconda cella con una coppia che contenga uno dei due valori (non entrambi)
            // data la coppia XY, trovati i complementari YZ, per ognuno ricerca il
            // complementare (ZX) destro o sinitro cioè
            // - su un gruppo che "vede" solo XY (sinistro) o
            // - su uno che "vede" solo YZ (destro)
            return !!gcells.find((cell_YZ) => {
              // valore centrale (Y)
              const YY = _intersection(cell_YZ.available, cell_XY.available);
              // la seconda cella (cella destra YZ) deve poter contenere 2 valori di cui
              // solo uno deve combaciare con con uno della prima cella (cella sinistra)
              if (!isTheSameCell(cell_YZ, cell_XY) && cell_YZ.available.length === 2 && YY.length === 1) {
                // valore sinistro (X)
                const X = _xor(cell_XY.available, YY)[0];
                // valore destro (Y)
                const Z = _xor(cell_YZ.available, YY)[0];
                // ricerca del complementare sinistro
                if (findComplementaryCell(cells, res, cell_XY, cell_YZ, g_XYZ, Z, X)) return true;
                // ricerca del complementare destro
                if (findComplementaryCell(cells, res, cell_YZ, cell_XY, g_XYZ, X, Z)) return true;
              }
              return res.applied;
            });
          }
          return res.applied;
        })
      });
    });
}


const findComplementaryCell = (cells: SudokuCell[], res: AlgorithmResult, cell1: SudokuCell, cell2: SudokuCell, gc1: SudokuGroup, V1: string, V2: string): boolean => {
  // ricerca del complementare su XY (XZ):
  return !!getCellGroups(cell1).find(xyg => {
    if (!isTheSameGroup(xyg, gc1)) {
      // ricerca nelle celle di xyg una che possa contenere solo
      //                                      cell_XZ
      return !!getGroupCells(cells, xyg).find(cell_cmp => {
        if (!isTheSameCell(cell_cmp, cell1) && cell_cmp.available.length===2 && _isEqual(cell_cmp.available, [V2,V1])) {
          // può eliminare il valore Z dalle celle che vedono contemporaneamente
          // cell_cmp e cell2
          return !!getCommonGroups(cells, [cell_cmp, cell2]).find(cg => {
            return !!getGroupCells(cells, cg).find(cgc => {
              if (!isTheSameCell(cgc, cell_cmp) && !isTheSameCell(cgc, cell2)) {
                onRemoved(cgc, V1, (removed) => {
                  res.applied = true;
                  res.highlights = getHighlights(cgc, [cell1.id, cell2.id, cell_cmp.id]);
                  res.descLines = getSingleResultLine(cgc,
                    `On cell ${cgc.coord} the possible values [${removed.join(',')}] have been removed`);
                });
              }
              return res.applied;
            })
          });
        }
        return res.applied;
      });
    }
    return res.applied;
  });
}

// registra l'algoritmo
registerAlgorithm(new CouplesAlgorithm());
