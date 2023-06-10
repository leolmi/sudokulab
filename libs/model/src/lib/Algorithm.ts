import { PlaySudoku } from './PlaySudoku';
import { AlgorithmResult } from './AlgorithmResult';
import { AlgorithmType } from './enums';

export abstract class Algorithm {
  abstract id: string;
  abstract name: string;
  abstract icon: string;
  abstract type: AlgorithmType;
  abstract factor: string;
  abstract title: string;
  abstract description: string;
  abstract apply(sdk: PlaySudoku): AlgorithmResult;
}


