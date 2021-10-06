import { PlaySudoku } from './PlaySudoku';
import { AlgorithmResult } from './AlgorithmResult';

export abstract class Algorithm {
  abstract id: string;
  abstract name: string;
  abstract icon: string;
  abstract apply(sdk: PlaySudoku): AlgorithmResult;
}


