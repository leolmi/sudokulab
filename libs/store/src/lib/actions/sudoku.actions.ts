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

export const clear = createAction(
  '[SudokuPlay] clear the sudoku'
);

export const updateSudoku = createAction(
  '[SudokuPlay] update active sudoku',
  props<{ changes: Partial<PlaySudoku> }>()
);

export const applyAlgorithm = createAction(
  '[SudokuPlay] apply algorithm to active sudoku',
  props<{ algorithm: string }>()
);

export const solveStep = createAction(
  '[SudokuPlay] try do a new solve step'
);

export const solve = createAction(
  '[SudokuPlay] try solve sudoku'
);




export const test = createAction(
  '[SudokuPlay] test sudoku action'
)
