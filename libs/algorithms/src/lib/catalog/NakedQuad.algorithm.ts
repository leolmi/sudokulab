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
  title = 'Quattro celle nello stesso gruppo condividono esattamente 4 candidati complessivi: questi valori vengono esclusi dalle altre celle del gruppo';
  description = 'Raro e difficile da individuare: quattro celle la cui unione dei candidati vale esattamente 4 valori';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => applyNakedSubset(this, cells, res, 4));
}

// registra l'algoritmo
registerAlgorithm(new NakedQuadAlgorithm());
