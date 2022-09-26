import { Algorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import {AlgorithmResult, AlgorithmResultLine} from '../AlgorithmResult';
import { find as _find, keys as _keys } from 'lodash';
import { checkAvailables } from '../logic';
import { isValue } from '../../global.helper';
import { PlaySudokuCell } from '../PlaySudokuCell';
import { AlgorithmType } from '../enums';
import {getCellUserCoord} from "../../sudoku.helper";

export const ONE_CELL_FOR_VALUE_ALGORITHM = 'OneCellForValue';

/**
 * ALGORITMO
 * Unica cella per valore
 *
 * all'interno di un gruppo esiste solo una cella per il valore
 */
export class OneCellForValueAlgorithm extends Algorithm {
  id = ONE_CELL_FOR_VALUE_ALGORITHM;
  factor = '+10';
  name = 'One cell for value';
  icon = 'crop_free';
  type = AlgorithmType.solver;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    let ocid = '';
    let ocvl = '';
    let applied = false;
    let cell: PlaySudokuCell|undefined = undefined;
    const xg = _find(sdk.groups, (g) => {
      const ov = _find(g?.availableOnCells||{}, (vls, v) => {
        ocvl = v;
        return _keys(vls || {}).length === 1;
      });
      if (!!ov) ocid = _keys(ov)[0];
      return !!ov
    });

    if (!!xg) {
      cell = sdk.cells[ocid];
      if (cell && !isValue(cell.value)) {
        applied = true;
        cell.value = ocvl;
        checkAvailables(sdk);
      }
    }

    return new AlgorithmResult({
      algorithm: this.id,
      applied,
      //description: getDescription(applied, cell),
      descLines: [new AlgorithmResultLine({
        cell: cell?.id,
        description: `Cell ${getCellUserCoord(cell?.id||'unknown')} has been assigned the value "${cell?.value}"`
      })],
      cells: [ocid]
    });
  }
}

