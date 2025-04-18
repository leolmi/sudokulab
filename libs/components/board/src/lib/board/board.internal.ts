import { BoardCell, BoardStatus } from './board.model';
import { remove as _remove } from 'lodash';
import { Cell } from '@olmi/model';

export const BOARD_PREFIX = ['%cBOARD', 'color:white;background-color:orangered;padding:2px 6px;'];

export const updateUserValues = (cell: BoardCell, v: string) => {
  cell.userValues = cell.userValues || [];
  if (cell.userValues.includes(v)) {
    _remove(cell.userValues, xv => xv === v);
  } else {
    cell.userValues.push(v);
  }
}

export const getBoardClasses = (status: BoardStatus): any => {
  return {
    [`edit-mode-${status.editMode}`]: true,
    [`values-mode-${status.valuesMode}`]: true,
    pencil: isRealPencil(status),
  }
}

export const isRealPencil = (status?: BoardStatus): boolean => !!status?.isPencil && status?.editMode === 'play';

export const nextPrev = (cell: Cell, rank: number) => {
  if (cell.col <= 0) {
    if (cell.row <= 0) {
      cell.col = rank - 1;
      cell.row = rank - 1;
    } else {
      cell.row--;
      cell.col = rank - 1;
    }
  } else {
    cell.col--;
  }
}

export const nextInRow = (cell: Cell, rank: number) => {
  if (cell.col >= rank - 1) {
    if (cell.row >= rank - 1) {
      cell.col = 0;
      cell.row = 0;
    } else {
      cell.row++;
      cell.col = 0;
    }
  } else {
    cell.col++;
  }
}

export const nextInSquare = (cell: Cell, rank: number) => {
  const grank = Math.sqrt(rank);
  if ((cell.col%grank) === grank - 1) {
    if ((cell.row%grank) === grank - 1) {
      if (cell.col >= rank - 1) {
        if (cell.row >= rank -1) {
          cell.col = 0;
          cell.row = 0;
        } else {
          cell.col = 0;
          cell.row++;
        }
      } else {
        cell.col++;
        cell.row = cell.row - 2;
      }
    } else {
      cell.row++;
      cell.col = cell.col - 2;
    }
  } else {
    cell.col++;
  }
}
