import {createAction, props} from '@ngrx/store';
import { GoogleCredentials, Sudoku, SudokulabPage, SudokuMessage } from '@sudokulab/model';
import { Dictionary } from '@ngrx/entity';

export const doGoogleLogin = createAction(
  '[SudokuLab.sudoku] google login',
  props<{ credentials: GoogleCredentials }>()
);

export const setToken = createAction(
  '[SudokuLab.sudoku] set token',
  props<{ token?: string }>()
);

export const setActivePage = createAction(
  '[SudokuLab.sudoku] set the active page',
  props<{ page: SudokulabPage|undefined, data?: any }>()
);

export const setActiveMessage = createAction(
  '[SudokuLab.sudoku] set the active alert',
  props<{ message: SudokuMessage }>()
);

export const updatePageStatus = createAction(
  '[SudokuLab.sudoku] update the page status',
  props<{ status: Dictionary<boolean>|undefined }>()
);

export const test = createAction(
  '[SudokuLab.sudoku] test sudoku action'
);

export const fillSchemas = createAction(
  '[SudokuLab.sudoku] fill the schema list'
);

export const checkSudoku = createAction(
  '[SudokuLab.sudoku] check the sudoku schema',
  props<{ schema: Sudoku }>()
);

export const updateDocumentTitle = createAction(
  '[SudokuLab.sudoku] update document title',
  props<{ data?: string }>()
);

export const saveUserSettings = createAction(
  '[SudokuLab.sudoku] save the user settings'
);

export const checkStatus = createAction(
  '[SudokuLab.sudoku] check the page status'
);

export const setTheme = createAction(
  '[SudokuLab.sudoku] set the theme',
  props<{ theme: string }>()
);

export const manage = createAction(
  '[SudokuLab.sudoku] manage operation',
  props<{ operation: string, args?: any }>()
);

export const setOperationStatus = createAction(
  '[SudokuLab.sudoku] set the operation status',
  props<{ status: number }>()
);
