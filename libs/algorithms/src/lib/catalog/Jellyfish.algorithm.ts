import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, GroupType, SudokuCell } from '@olmi/model';
import { applyAlgorithm, registerAlgorithm } from '../algorithms.common';
import { applyFish } from '../algorithms.subset.helper';

export const JELLYFISH_ALGORITHM = 'Jellyfish';

/**
 * ALGORITMO Jellyfish
 *
 * Generalizzazione di X-Wings/Swordfish a 4 righe/colonne: un valore compare
 * in 2-4 celle per ciascuna di 4 righe, confinato nelle stesse 4 colonne (o viceversa).
 * In tutte le altre celle delle 4 colonne (o righe) il valore può essere rimosso.
 */
export class JellyfishAlgorithm extends Algorithm {
  id = JELLYFISH_ALGORITHM;
  priority = 15;
  factor = '+360+(NEP*160)';
  name = 'Jellyfish';
  icon = 'phishing';
  type = AlgorithmType.support;
  title = 'Jellyfish';
  description = `Estensione di Swordfish su 4 righe/colonne. Tecnica avanzata: contribuisce a rimuovere candidati dalle celle interessate`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      applyFish(this, cells, res, 4, GroupType.row);
      if (!res.applied) applyFish(this, cells, res, 4, GroupType.column);
    });
}

// registra l'algoritmo
registerAlgorithm(new JellyfishAlgorithm());
