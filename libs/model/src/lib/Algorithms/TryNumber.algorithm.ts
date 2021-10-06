import { Algorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { head as _head, values as _values, minBy as _minBy, cloneDeep as _clone } from 'lodash';
import { Sudoku } from '../Sudoku';
import { checkAvailables } from '../logic';
import { getValues } from '../../sudoku.helper';
import { PlaySudokuCell } from '../PlaySudokuCell';
import { PlaySudokuGroup } from '../PlaySudokuGroup';

export const TRY_NUMBER_ALGORITHM = 'TryNumber';

const _valorize = (sdk: PlaySudoku, cell: PlaySudokuCell, av: string): PlaySudoku => {
  const tc = sdk.cells[cell.id];
  if (tc) tc.value = av;
  checkAvailables(sdk);
  return sdk;
}

/**
 * ALGORITMO
 * Tenta la valorizzazione
 *
 * algoritmo a tentativi, genera tanti schemi quanti valori disponibili affre la
 * cella scelta
 */
export class TryNumberAlgorithm extends Algorithm {
  id = TRY_NUMBER_ALGORITHM;
  name = 'Try number in cell';
  icon = 'generating_tokens';
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    // ricerca la cella con minor numero di valori possibili fra quelle non valorizzate
    const minc = _minBy(_values(sdk.cells), (c) => c?.value ? 1000 : c?.availables.length || 1000);
    if ((minc?.availables || []).length <= 1) return AlgorithmResult.none(this);
    const cases: PlaySudoku[] = [];
    if (minc) {
      const minvalues = _clone(minc.availables);
      const template = _clone(sdk);
      minvalues.forEach((av, index) => {
        if (index === 0) {
          _valorize(sdk, minc, av);
        } else if (!!template) {
          const clone = _clone(template);
          cases.push(_valorize(clone, minc, av));
        }
      })
    }

    return new AlgorithmResult({
      algorithm: this.id,
      applied: (!!minc && cases.length > 0),
      cells: !!minc ? [minc.id] : [],
      description: getDescription(minc),
      cases
    });
  }
}

const getDescription = (c?: PlaySudokuCell): string =>
  c ? `The schema has been split on cell "${c.id}" using the values [${c.availables.join(',')}]` : '';
