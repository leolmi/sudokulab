import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, GroupType, SudokuCell } from '@olmi/model';
import { applyAlgorithm, registerAlgorithm } from '../algorithms.common';
import { applyFish } from '../algorithms.subset.helper';

export const SWORDFISH_ALGORITHM = 'Swordfish';

/**
 * ALGORITMO Swordfish
 *
 * Generalizzazione di X-Wings a 3 righe/colonne: un valore compare in 2-3
 * celle per ciascuna di 3 righe, confinato nelle stesse 3 colonne (o viceversa).
 * In tutte le altre celle delle 3 colonne (o righe) il valore può essere rimosso.
 */
export class SwordfishAlgorithm extends Algorithm {
  id = SWORDFISH_ALGORITHM;
  priority = 11;
  factor = '+240+(NEP*100)';
  name = 'Swordfish';
  icon = 'set_meal';
  type = AlgorithmType.support;
  title = 'Swordfish';
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      applyFish(this, cells, res, 3, GroupType.row);
      if (!res.applied) applyFish(this, cells, res, 3, GroupType.column);
    });
}

// registra l'algoritmo
registerAlgorithm(new SwordfishAlgorithm());
