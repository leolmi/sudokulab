import { PlaySudoku } from './PlaySudoku';
import { AlgorithmResult } from './AlgorithmResult';

export interface PlayAlgorithm {
  id: string;
  name: string;
  apply: (sdk: PlaySudoku) => AlgorithmResult;
}

export class Algorithm {
  constructor(a?: Partial<Algorithm>) {
    this.cell = -1;
    Object.assign(this, a || {});
  }
  cell: number;
}


