import { cloneDeep as _clone } from 'lodash';
import { BoardCell, BoardChangeEvent } from './board.model';
import { getCellValue, onCell } from './board.helper';
import { isRealPencil, updateUserValues } from './board.internal';
import { isDynamicValue, isNumberCellValue } from '@olmi/model';

/**
 * Applica un BoardChangeEvent a uno snapshot di celle e ritorna la nuova
 * lista (immutable). Se l'evento non produce alcun cambiamento (board
 * disabilitata, cella fissa in play, dynamic non consentito o cella non
 * trovata) ritorna `null`.
 */
export const handleBoardValue = (cells: BoardCell[], e: BoardChangeEvent): BoardCell[] | null => {
  // la board è disabilitata
  if (e.status.isDisabled) return null;
  // la board è in modalità play e la cella è fissa
  if (e.status.editMode === 'play' && e.cell?.isFixed) return null;
  // esclude i valori dinamici se l'opzione non è attiva
  if (isDynamicValue(e.value) && !e.status.isDynamic) return null;

  const next = _clone(cells);
  let applied = false;
  onCell(next, e.cell, (cell) => {
    switch (e.status.editMode) {
      case 'schema':
        cell.text = getCellValue(e.value, e.status);
        cell.userValues = [];
        cell.isFixed = isNumberCellValue(cell.text);
        cell.isDynamic = e.status.isDynamic && isDynamicValue(cell.text);
        break;
      case 'play': {
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
    }
    applied = true;
  });
  return applied ? next : null;
};
