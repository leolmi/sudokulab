import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, SudokuCell } from '@olmi/model';
import { applyAlgorithm, registerAlgorithm } from '../algorithms.common';
import { applyHiddenSubset } from '../algorithms.subset.helper';

export const HIDDEN_PAIR_ALGORITHM = 'HiddenPair';

/**
 * ALGORITMO Hidden Pair
 *
 * Due valori in un gruppo compaiono solo in 2 specifiche celle (possono comparire
 * "nascosti" fra altri candidati): da quelle due celle è possibile rimuovere
 * tutti i candidati diversi dai due valori.
 */
export class HiddenPairAlgorithm extends Algorithm {
  id = HIDDEN_PAIR_ALGORITHM;
  priority = 3;
  factor = '+45+(NEP*25)';
  name = 'Hidden Pair';
  icon = 'bookmark_border';
  type = AlgorithmType.support;
  title = 'Due valori che in un gruppo possono stare solo in due specifiche celle: in quelle celle possono essere rimossi tutti gli altri candidati';
  description = 'Controparte "hidden" del Naked Pair: si ragiona sui valori anziché sulle celle, cercando coppie di valori confinate in due posizioni';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => applyHiddenSubset(this, cells, res, 2));
}

// registra l'algoritmo
registerAlgorithm(new HiddenPairAlgorithm());
