import {createAction, props} from '@ngrx/store';
import { Sudoku, SudokulabPage, SudokuMessage } from '@sudokulab/model';
import { Dictionary } from '@ngrx/entity';

export const setActivePage = createAction(
  '[SudokuPlay.sudoku] set the active page',
  props<{ page: SudokulabPage|undefined, data?: any }>()
);

export const setActiveMessage = createAction(
  '[SudokuPlay.sudoku] set the active alert',
  props<{ message: SudokuMessage }>()
);

export const updatePageStatus = createAction(
  '[SudokuPlay.sudoku] update the page status',
  props<{ status: Dictionary<boolean>|undefined }>()
);

export const test = createAction(
  '[SudokuPlay.sudoku] test sudoku action'
);

export const fillSchemas = createAction(
  '[SudokuPlay.sudoku] fill the schema list'
);

export const checkSudoku = createAction(
  '[SudokuPlay.sudoku] check the sudoku schema',
  props<{ schema: Sudoku }>()
);

export const updateDocumentTitle = createAction(
  '[SudokuPlay.sudoku] update document title',
  props<{ data?: string }>()
);

export const saveUserSettings = createAction(
  '[SudokuPlay.sudoku] save the user settings'
);

export const checkStatus = createAction(
  '[SudokuPlay.sudoku] check the page status'
);

export const setTheme = createAction(
  '[SudokuPlay.sudoku] set the theme',
  props<{ theme: string }>()
);
