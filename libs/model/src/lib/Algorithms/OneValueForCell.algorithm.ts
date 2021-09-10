import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { find as _find } from 'lodash';
import { checkAvailables } from '../logic';

export const ONE_VALUE_FOR_CELL_ALGORITHM = 'OneValueForCell';

/**
 * ALGORITMO
 * Unico valore per la cella
 *
 * all'interno di un gruppo la cella può contenere solo un valore
 */
export class OneValueForCellAlgorithm extends Algorithm implements PlayAlgorithm {
  constructor(a?: Partial<OneValueForCellAlgorithm>) {
    super(a);
    this.name = 'One value for cell';
    this.id = ONE_VALUE_FOR_CELL_ALGORITHM;
  }
  id: string;
  name: string;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    const cell = _find(sdk.cells, c => (c?.availables || []).length === 1);

    if (!!cell) {
      cell.value = cell.availables[0];
      checkAvailables(sdk);
    }

    return new AlgorithmResult({
      algorithm: this.id,
      applied: !!cell,
      cells: !!cell ? [cell.id] : undefined
    });
  }
}
