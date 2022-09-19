import { Algorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { find as _find } from 'lodash';
import { checkAvailables } from '../logic';
import { PlaySudokuCell } from '../PlaySudokuCell';
import { AlgorithmType } from '../enums';
import {getCellUserCoord} from "../../sudoku.helper";

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
  factor = '+25';
  name = 'One value for cell';
  icon = 'center_focus_strong';
  type = AlgorithmType.solver;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    const cell = _find(sdk.cells, c => (!c?.value && c?.availables || []).length === 1);

    if (!!cell) {
      cell.value = cell.availables[0];
      checkAvailables(sdk);
    }

    return new AlgorithmResult({
      algorithm: this.id,
      applied: !!cell,
      description: getDescription(cell),
      cells: !!cell ? [cell.id] : undefined
    });
  }
}

const getDescription = (cell?: PlaySudokuCell): string =>
  cell ? `Cell "${getCellUserCoord(cell.id)}" has been assigned the value "${cell.value}"` : '';
