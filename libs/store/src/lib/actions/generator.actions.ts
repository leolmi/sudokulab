import {createAction, props} from "@ngrx/store";
import { EditSudoku, Sudoku } from '@sudokulab/model';


export const setActiveGeneratorCell = createAction(
  '[SudokuPlay.generator] set the active cell of generator',
  props<{ id: string }>()
);

export const setActiveGeneratorCellRequest = createAction(
  '[SudokuPlay.generator] send request for the active cell of generator',
  props<{ id: string }>()
);

export const clearGenerator = createAction(
  '[SudokuPlay.generator] clear the sudoku generator schema'
);

export const setGeneratorValue = createAction(
  '[SudokuPlay.generator] set value into cell',
  props<{ value: string }>()
)

export const moveGenerator = createAction(
  '[SudokuPlay.generator] move selection on direction',
  props<{ direction: string }>()
)

export const updateGeneratorSchema = createAction(
  '[SudokuPlay.generator] update active schema',
  props<{ changes: Partial<EditSudoku> }>()
);

export const checkGeneratorState = createAction(
  '[SudokuPlay.generator] check the schema state'
);

export const setGeneratorStatus = createAction(
  '[SudokuPlay.generator] set generator engine status',
  props<{ active: boolean }>()
);

export const stopGeneratorRequest = createAction(
  '[SudokuPlay.generator] stop generator engine request'
);

export const addSchema = createAction(
  '[SudokuPlay.generator] add a new schema',
  props<{ schema: Sudoku }>()
);

export const clearGeneratedSchemas = createAction(
  '[SudokuPlay.generator] clear all schemas'
);

export const downloadGeneratedSchemas = createAction(
  '[SudokuPlay.generator] download all schemas'
);
