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
  priority = 5;
  factor = '+50+(NEP*30)';
  name = 'Naked Triple';
  icon = 'grid_3x3';
  type = AlgorithmType.support;
  title = 'Tre celle nello stesso gruppo condividono esattamente 3 candidati complessivi: questi valori vengono esclusi dalle altre celle del gruppo';
  description = 'Più complesso dei Twins: richiede di riconoscere tre celle (non necessariamente tutte con 3 candidati) la cui unione dei candidati è esattamente di 3 valori';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => applyNakedSubset(this, cells, res, 3));
}

// registra l'algoritmo
registerAlgorithm(new NakedTripleAlgorithm());
