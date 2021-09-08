import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { find as _find, keys as _keys } from 'lodash';
import { checkAvailables } from '../../sudoku-helper';

export const ONE_CELL_FOR_VALUE_ALGORITHM = 'OneCellForValue';

/**
 * ALGORITMO
 * Unica cella per valore
 *
 * all'interno di un gruppo esiste solo una cella per il valore
 */
export class OneCellForValueAlgorithm extends Algorithm implements PlayAlgorithm {
  constructor(a?: Partial<OneCellForValueAlgorithm>) {
    super(a);
    this.name = 'One cell for value';
    this.id = ONE_CELL_FOR_VALUE_ALGORITHM;
    this.factor = 1.1;
  }
  id: string;
  name: string;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    let ocid: string = '';
    let ocvl: string = '';
    const xg = _find(sdk.groups, (g) => {
      const ov = _find(g?.availableOnCells||{}, (vls, v) => {
        ocvl = v;
        return _keys(vls || {}).length === 1;
      });
      if (!!ov) ocid = _keys(ov)[0];
      return !!ov
    });

    if (!!xg) {
      const cell = sdk.cells[ocid];
      if (cell) cell.value = ocvl;
      checkAvailables(sdk);
    }

    return new AlgorithmResult({
      applied: !!xg,
      cells: [ocid]
    });
  }
}
