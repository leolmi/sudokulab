import { AlgorithmResult } from './AlgorithmResult';
import { PlaySudoku } from './PlaySudoku';

export class SudokuSolution {
  constructor(public sdk: PlaySudoku) {
    this.algorithms = [];
  }
  algorithms: AlgorithmResult[];
}
