import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { find as _find } from 'lodash';
import { Dictionary } from '@ngrx/entity';
import { checkAvailables } from '../../sudoku-helper';

export const ONE_CELL_FOR_VALUE_ALGORITHM = 'OneCellForValue';

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
      const gks: Dictionary<string[]> = {};
      g.cells.forEach(c => {
        c.availables.forEach(av => {
          const avs = `${av}`;
          gks[avs] = gks[avs] || [];
          (gks[avs] || []).push(c.id);
        });
      });

      const ov = _find(gks, (vls, v) => {
        ocvl = v;
        return (vls || []).length === 1;
      });
      if (!!ov) ocid = ov[0]
      return !!ov
    });

    if (!!xg) {
      sdk.cells[ocid].value = ocvl;
      checkAvailables(sdk);
    }

    return new AlgorithmResult({
      applied: !!xg,
      cells: [ocid]
    });
  }
}
