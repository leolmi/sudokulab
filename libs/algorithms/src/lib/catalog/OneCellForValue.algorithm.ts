import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  applyCellValue,
  findGroup,
  getCellsAvailableMap,
  getCoord,
  onCell,
  SudokuCell
} from '@olmi/model';
import { keys as _keys } from 'lodash';
import { applyAlgorithm, getHighlights, getSingleResultLine, registerAlgorithm } from '../algorithms.common';

export const ONE_CELL_FOR_VALUE_ALGORITHM = 'OneCellForValue';

/**
 * ALGORITMO
 * Unica cella per valore
 *
 * all'interno di un gruppo esiste solo una cella per il valore
 */
export class OneCellForValueAlgorithm extends Algorithm {
  id = ONE_CELL_FOR_VALUE_ALGORITHM;
  priority = 0;
  factor = '+10';
  name = 'One cell for value';
  icon = 'crop_free';
  type = AlgorithmType.solver;
  title = 'esiste una sola cella nel gruppo che possa ospitare quel determinato valore';
  description = 'Rappresenta l\'approccio più basico e più immediato al quale è stato associato un punteggio minimo';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      findGroup(cells, (gcs, group) => {
        const valuesMap = getCellsAvailableMap(gcs);
        return  !!_keys(valuesMap).find(value => {
          const cids = _keys(valuesMap[value]);
          res.applied = (cids.length === 1);
          if (res.applied) {
            onCell(cells, cids[0], (cell) => applyCellValue(cell, value));
            res.value = value;
            res.cells = [cids[0]];
            res.highlights = getHighlights(cids[0]);
            res.descLines = getSingleResultLine(cids[0],
              `Cell ${getCoord(cids[0]) || 'unknown'} is the only one that can assume the value "${value}"`, true);
          }
          return res.applied;
        });
      });
    });
}

// registra l'algoritmo
registerAlgorithm(new OneCellForValueAlgorithm());
