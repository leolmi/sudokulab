import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';

export const TWINS_ALGORITHM = 'Twins';

export class TwinsAlgorithm extends Algorithm implements PlayAlgorithm {
  constructor(a?: Partial<TwinsAlgorithm>) {
    super(a);
    this.name = 'Twins in group';
    this.id = TWINS_ALGORITHM;
    this.factor = 1.3;
  }
  id: string;
  name: string;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    const cls = sdk.cells;

    return new AlgorithmResult();
  }
}
