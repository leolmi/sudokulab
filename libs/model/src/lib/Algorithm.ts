import { PlaySudoku } from './PlaySudoku';
import { AlgorithmResult } from './AlgorithmResult';

export interface PlayAlgorithm {
  apply: (sdk: PlaySudoku) => AlgorithmResult;
}

export class Algorithm {
  constructor(a?: Partial<Algorithm>) {
    this.factor = 1;
    this.cell = -1;
    Object.assign(this, a || {});
  }
  factor: number;
  cell: number;
}


