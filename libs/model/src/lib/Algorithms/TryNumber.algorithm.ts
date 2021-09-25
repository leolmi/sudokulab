import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { head as _head, values as _values, minBy as _minBy, cloneDeep as _clone } from 'lodash';
import { Sudoku } from '../Sudoku';
import { checkAvailables } from '../logic';
import { getValues } from '../../sudoku.helper';

export const TRY_NUMBER_ALGORITHM = 'TryNumber';

/**
 * ALGORITMO
 * Tenta la valorizzazione
 *
 * algoritmo a tentativi, genera tanti schemi quanti valori disponibili affre la
 * cella scelta
 */
export class TryNumberAlgorithm extends Algorithm implements PlayAlgorithm {
  constructor(a?: Partial<TryNumberAlgorithm>) {
    super(a);
    this.name = 'Try number in cell';
    this.id = TRY_NUMBER_ALGORITHM;
  }
  id: string;
  name: string;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    // ricerca la cella con minor numero di valori possibili fra quelle non valorizzate
    // const firstc = _head(_values(sdk.couples));
    const minc = _minBy(_values(sdk.cells), (c) => c?.value ? 1000 : c?.availables.length || 1000);
    const cases: Sudoku[] = [];
    if (minc) {
      const minvalues = _clone(minc.availables);
      const values = getValues(sdk);
      minvalues.forEach((av, index) => {
        if (index===0) {
          minc.value = av;
          checkAvailables(sdk);
        } else {
          cases.push(new Sudoku({
            values: values.substr(0, minc.position) + av + values.substr(minc.position + 1),
            rank: sdk.sudoku?.rank,
            fixed: sdk.sudoku?.fixed
          }))
        }
      })
    }

    return new AlgorithmResult({
      algorithm: this.id,
      applied: !!minc,
      cells: !!minc ? [minc.id] : [],
      cases
    });
  }
}
