import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, SudokuCell } from '@olmi/model';
import { applyAlgorithm, registerAlgorithm } from '../algorithms.common';
import { applyHiddenSubset } from '../algorithms.subset.helper';

export const HIDDEN_TRIPLE_ALGORITHM = 'HiddenTriple';

/**
 * ALGORITMO Hidden Triple
 *
 * Tre valori in un gruppo confinati in 3 specifiche celle: dalle 3 celle
 * è possibile rimuovere tutti i candidati diversi da quei tre valori.
 */
export class HiddenTripleAlgorithm extends Algorithm {
  id = HIDDEN_TRIPLE_ALGORITHM;
  priority = 6;
  factor = '+80+(NEP*45)';
  name = 'Hidden Triple';
  icon = 'bookmark_border';
  type = AlgorithmType.support;
  title = 'Tre valori che in un gruppo possono stare solo in 3 specifiche celle: in quelle celle possono essere rimossi tutti gli altri candidati';
  description = 'Controparte "hidden" del Naked Triple: si ragiona sui valori anziché sulle celle';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => applyHiddenSubset(this, cells, res, 3));
}

// registra l'algoritmo
registerAlgorithm(new HiddenTripleAlgorithm());
