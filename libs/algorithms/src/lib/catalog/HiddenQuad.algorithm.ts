import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, SudokuCell } from '@olmi/model';
import { applyAlgorithm, registerAlgorithm } from '../algorithms.common';
import { applyHiddenSubset } from '../algorithms.subset.helper';

export const HIDDEN_QUAD_ALGORITHM = 'HiddenQuad';

/**
 * ALGORITMO Hidden Quad
 *
 * Quattro valori in un gruppo confinati in 4 specifiche celle.
 */
export class HiddenQuadAlgorithm extends Algorithm {
  id = HIDDEN_QUAD_ALGORITHM;
  priority = 7;
  factor = '+130+(NEP*65)';
  name = 'Hidden Quad';
  icon = 'bookmark_border';
  type = AlgorithmType.support;
  title = 'Quattro valori che in un gruppo possono stare solo in 4 specifiche celle: in quelle celle possono essere rimossi tutti gli altri candidati';
  description = 'Molto difficile da individuare manualmente: quattro valori confinati in quattro posizioni';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => applyHiddenSubset(this, cells, res, 4));
}

// registra l'algoritmo
registerAlgorithm(new HiddenQuadAlgorithm());
