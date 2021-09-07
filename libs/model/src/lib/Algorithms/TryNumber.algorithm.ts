import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';

export const TRY_NUMBER_ALGORITHM = 'TryNumber';

export class TryNumberAlgorithm extends Algorithm implements PlayAlgorithm {
  constructor(a?: Partial<TryNumberAlgorithm>) {
    super(a);
    this.name = 'Try number in cell';
    this.id = TRY_NUMBER_ALGORITHM;
    this.factor = 1.9;
  }
  id: string;
  name: string;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    const cls = sdk.cells;

    return new AlgorithmResult();
  }
}
