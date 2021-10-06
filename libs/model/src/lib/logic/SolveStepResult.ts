import { AlgorithmResult } from '../AlgorithmResult';
import { PlaySudoku } from '../PlaySudoku';

export class SolveStepResult {
  constructor(public sdk: PlaySudoku,
              public result: AlgorithmResult|undefined,
              public error?: string) {
  }
}
