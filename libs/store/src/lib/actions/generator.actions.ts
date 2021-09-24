import {createAction, props} from "@ngrx/store";
import { EditSudoku, Sudoku, WorkingInfo } from '@sudokulab/model';
import { Dictionary } from '@ngrx/entity';


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

export const generateSchema = createAction(
  '[SudokuPlay.generator] generate schema with defined options'
);

export const clearGeneratedSchemas = createAction(
  '[SudokuPlay.generator] clear all schemas'
);

export const downloadGeneratedSchemas = createAction(
  '[SudokuPlay.generator] download all schemas'
);

export const downloadActiveGeneratorSchema = createAction(
  '[SudokuPlay.generator] download active generator schema'
);

export const openSchemaInLab = createAction(
  '[SudokuPlay.generator] open schema in lab',
  props<{ schema: Sudoku }>()
);

export const setWorkingInfo = createAction(
  '[SudokuPlay.generator] set the working info',
  props<{ info: WorkingInfo|undefined }>()
);

export const loadGeneratorSchema = createAction(
  '[SudokuPlay.generator] load a schema in generator',
  props<{ schema: Sudoku }>()
);
