import { BehaviorSubject } from 'rxjs';
import { cloneDeep as _clone } from 'lodash';
import { BoardCell, BoardChangeEvent } from './board.model';
import { getCellValue, onCell } from './board.helper';
import { isRealPencil, updateUserValues } from './board.internal';
import { isDynamicValue, isNumberCellValue } from '@olmi/model';

export const handleBoardValue = (cells$: BehaviorSubject<BoardCell[]>, e: BoardChangeEvent) => {
  // la board è disabilitata
  if (e.status.isDisabled) return;
  // la board è in modalità play e la cella è fissa
  if (e.status.editMode === 'play' &&  e.cell?.isFixed) return;
  // esclude i valori dinamicise l'opzione non è attiva
  if (isDynamicValue(e.value) && !e.status.isDynamic) return;

  const cells = _clone(cells$.value);
  onCell(cells, e.cell, (cell) => {
    switch (e.status.editMode) {
      case 'schema':
        cell.text = getCellValue(e.value, e.status);
        cell.userValues = [];
        cell.isFixed = isNumberCellValue(cell.text);
        cell.isDynamic = e.status.isDynamic && isDynamicValue(cell.text);
        break;
      case 'play':
        if (cell.isFixed) return;
        const v = getCellValue(e.value, e.status);
        if (isRealPencil(e.status)) {
          if (v) {
            updateUserValues(cell, v);
            cell.text = '';
          } else {
            cell.userValues = [...e.userValues];
          }
        } else {
          cell.text = v;
          cell.userValues = [];
        }
        break;
    }
    cells$.next(cells);
  });
}
