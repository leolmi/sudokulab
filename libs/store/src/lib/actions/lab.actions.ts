import {createAction, props} from "@ngrx/store";
import { PlaySudoku, SchemasOptions, SolveStepResult, Sudoku } from '@sudokulab/model';

export const setActiveSudoku = createAction(
  '[SudokuPlay.lab] set the active sudoku',
  props<{ active: number }>()
);

export const setActiveCell = createAction(
  '[SudokuPlay.lab] set the active cell',
  props<{ id: string }>()
);

export const loadSudoku = createAction(
  '[SudokuPlay.lab] load a sudoku',
  props<{ sudoku: Sudoku }>()
);

export const loadSchemas = createAction(
  '[SudokuPlay.lab] load scehmas store',
  props<{ schemas: PlaySudoku[] }>()
);

export const clear = createAction(
  '[SudokuPlay.lab] clear the sudoku'
);

export const updateSudoku = createAction(
  '[SudokuPlay.lab] update active sudoku',
  props<{ changes: Partial<PlaySudoku> }>()
);

export const checkState = createAction(
  '[SudokuPlay.lab] check the schema state'
);

export const applyAlgorithm = createAction(
  '[SudokuPlay.lab] apply algorithm to active sudoku',
  props<{ algorithm: string }>()
);

export const stepInfo = createAction(
  '[SudokuPlay.lab] show the next step info'
);

export const solveStep = createAction(
  '[SudokuPlay.lab] try do a new solve step'
);

export const solve = createAction(
  '[SudokuPlay.lab] try solve sudoku'
);

export const analyze = createAction(
  '[SudokuPlay.lab] analyze sudoku'
);

export const setValue = createAction(
  '[SudokuPlay.lab] set value into cell',
  props<{ value: string }>()
)

export const move = createAction(
  '[SudokuPlay.lab] move selection on direction',
  props<{ direction: string }>()
)

export const dowloadSchema = createAction(
  '[SudokuPlay.lab] download current schema'
);

export const updateSchemasOptions = createAction(
  '[SudokuPlay.lab] update current schemas options',
  props<{ changes: Partial<SchemasOptions> }>()
);

export const setStepInfo = createAction(
  '[SudokuPlay.lab] set current step-info',
  props<{ info?: SolveStepResult }>()
);

export const highlightCells = createAction(
  '[SudokuPlay.lab] highlight cells',
  props<{ cells?: string[] }>()
);
