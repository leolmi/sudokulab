import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, SudokuCell } from '@olmi/model';
import { applyAlgorithm, registerAlgorithm } from '../algorithms.common';
import { applyNakedSubset } from '../algorithms.subset.helper';

export const NAKED_QUAD_ALGORITHM = 'NakedQuad';

/**
 * ALGORITMO Naked Quad
 *
 * Quattro celle nello stesso gruppo i cui candidati (unione) sono esattamente 4 valori.
 * Quei 4 valori possono essere rimossi da tutte le altre celle del gruppo.
 */
export class NakedQuadAlgorithm extends Algorithm {
  id = NAKED_QUAD_ALGORITHM;
  priority = 6;
  factor = '+100+(NEP*60)';
  name = 'Naked Quad';
  icon = 'grid_4x4';
  type = AlgorithmType.support;
  title = 'alg.NakedQuad.title';
  description = 'alg.NakedQuad.description';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => applyNakedSubset(this, cells, res, 4));
}

// registra l'algoritmo
registerAlgorithm(new NakedQuadAlgorithm());
