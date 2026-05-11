import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, SudokuCell } from '@olmi/model';
import { applyAlgorithm, registerAlgorithm } from '../algorithms.common';
import { applyNakedSubset } from '../algorithms.subset.helper';

export const NAKED_TRIPLE_ALGORITHM = 'NakedTriple';

/**
 * ALGORITMO Naked Triple
 *
 * Tre celle nello stesso gruppo i cui candidati (unione) sono esattamente 3 valori.
 * Quei 3 valori possono essere rimossi da tutte le altre celle del gruppo.
 */
export class NakedTripleAlgorithm extends Algorithm {
  id = NAKED_TRIPLE_ALGORITHM;
  priority = 4;
  factor = '+50+(NEP*30)';
  name = 'Naked Triple';
  icon = 'grid_3x3';
  type = AlgorithmType.support;
  title = 'alg.NakedTriple.title';
  description = 'alg.NakedTriple.description';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => applyNakedSubset(this, cells, res, 3));
}

// registra l'algoritmo
registerAlgorithm(new NakedTripleAlgorithm());
