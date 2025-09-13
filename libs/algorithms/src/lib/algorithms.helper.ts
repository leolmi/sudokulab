import { Algorithm, AlgorithmResult, ApplyAlgorithmOptions, SudokuCell, TRY_NUMBER_ALGORITHM } from '@olmi/model';
import { ALGORITHMS, ALGORITHMS_MAP } from './algorithms.common';

const skipAlgorithm = (alg: Algorithm, o?: ApplyAlgorithmOptions): boolean =>
  (alg.id === TRY_NUMBER_ALGORITHM && !o?.useTryAlgorithm) ||
  (o?.skipAlgorithm||[]).includes(alg.id);


/**
 * trova il primo algoritmo che riesce ad essere applicato, se non ne trova ritorna undefined
 * @param cells
 * @param o
 */
export const findFirstAppliedAlgorithm = (cells: SudokuCell[], o?: ApplyAlgorithmOptions): AlgorithmResult|undefined => {
  for (const alg of ALGORITHMS) {
    if (!skipAlgorithm(alg, o)) {
      const result = alg.apply(cells);
      if (result.applied) return result;
    }
  }
  return undefined;
}

export const getAlgorithm = (id: string): Algorithm|undefined => ALGORITHMS_MAP[id];

export const getAlgorithms = () => ALGORITHMS;
