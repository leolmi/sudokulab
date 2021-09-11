import {createAction, props} from '@ngrx/store';
import {SudokulabPage, SudokuMessage} from '@sudokulab/model';

export const setActivePage = createAction(
  '[SudokuPlay.sudoku] set the active page',
  props<{ page: SudokulabPage }>()
);

export const setActiveMessage = createAction(
  '[SudokuPlay.sudoku] set the active alert',
  props<{ message: SudokuMessage }>()
);


export const test = createAction(
  '[SudokuPlay.sudoku] test sudoku action'
)
