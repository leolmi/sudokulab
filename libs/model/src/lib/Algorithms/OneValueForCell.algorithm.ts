import {Algorithm} from '../Algorithm';
import {PlaySudoku} from '../PlaySudoku';
import {AlgorithmResult, AlgorithmResultLine} from '../AlgorithmResult';
import {find as _find} from 'lodash';
import {checkAvailables} from '../logic';
import {AlgorithmType} from '../enums';
import {getUserCoord} from "../../sudoku.helper";
import {isValue} from '../../global.helper';

export const ONE_VALUE_FOR_CELL_ALGORITHM = 'OneValueForCell';

/**
 * ALGORITMO
 * Unico valore per la cella
 *
 * all'interno di un gruppo la cella può contenere solo un valore
 *
 * fattore: +25
 */
export class OneValueForCellAlgorithm extends Algorithm {
  id = ONE_VALUE_FOR_CELL_ALGORITHM;
  // Questo metodo è più difficile da vedere e usare se sono
  // molti i numeri mancanti
  factor = '+25+(NEP*15)';
  name = 'One value for cell';
  icon = 'center_focus_strong';
  type = AlgorithmType.solver;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    const cell = _find(sdk.cells, c => (!isValue(c?.value) && c?.availables || []).length === 1);

    if (!!cell) {
      cell.value = cell.availables[0];
      checkAvailables(sdk);
    }

    return new AlgorithmResult({
      algorithm: this.id,
      applied: !!cell,
      descLines: [new AlgorithmResultLine({
        cell: cell?.id,
        description: `Cell ${getUserCoord(cell?.id||'unknown')} has been assigned the value "${cell?.value}"`
      })],
      cells: !!cell ? [cell.id] : undefined
    });
  }
}
