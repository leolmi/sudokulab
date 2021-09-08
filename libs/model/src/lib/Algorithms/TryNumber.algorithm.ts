import { Algorithm, PlayAlgorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { head as _head, values as _values, minBy as _minBy } from 'lodash';
import { Sudoku } from '../Sudoku';
import { checkAvailables, getValues } from '../../sudoku-helper';

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
    this.factor = 1.9;
  }
  id: string;
  name: string;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    // ricerca la cella con minor numero di valori possibili
    // const firstc = _head(_values(sdk.couples));
    const minc = _minBy(_values(sdk.cells), (c) => c?.availables.length||100);
    const cases: Sudoku[] = [];
    if (minc) {
      minc.availables.forEach((av, index) => {
        if (index===0) {
          minc.value = av;
          checkAvailables(sdk);
        } else {
          let values = getValues(sdk);
          values = values.substr(0, minc.position) + av + values.substr(minc.position + 1);
          cases.push(new Sudoku({
            values,
            rank: sdk.sudoku?.rank,
            fixed: sdk.sudoku?.fixed
          }))
        }
      })
    }

    return new AlgorithmResult({
      applied: !!minc,
      cells: !!minc ? [minc.id] : [],
      cases
    });
  }
}
