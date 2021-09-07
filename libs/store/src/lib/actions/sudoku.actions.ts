import { createAction, props } from '@ngrx/store';
import { PlaySudoku, Sudoku } from '@sudokulab/model';

export const setActiveSudoku = createAction(
  '[SudokuPlay] set the active sudoku',
  props<{ active: string }>()
);

export const loadSudoku = createAction(
  '[SudokuPlay] load a sudoku',
  props<{ sudoku: Sudoku }>()
);

export const updateSudoku = createAction(
  '[SudokuPlay] update active sudoku',
  props<{ changes: Partial<PlaySudoku> }>()
);

export const applyAlgorithm = createAction(
  '[SudokuPlay] apply algorithm to active sudoku',
  props<{ algorithm: string }>()
);







export const test = createAction(
  '[SudokuPlay] test sudoku action'
)
