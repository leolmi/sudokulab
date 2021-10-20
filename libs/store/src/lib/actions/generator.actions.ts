import { createAction, props } from '@ngrx/store';
import { EditSudoku, Sudoku, WorkingInfo } from '@sudokulab/model';


export const setActiveGeneratorCell = createAction(
  '[SudokuLab.generator] set the active cell of generator',
  props<{ id: string }>()
);

export const setActiveGeneratorCellRequest = createAction(
  '[SudokuLab.generator] send request for the active cell of generator',
  props<{ id: string }>()
);

export const clearGenerator = createAction(
  '[SudokuLab.generator] clear the sudoku generator schema'
);

export const setGeneratorValue = createAction(
  '[SudokuLab.generator] set value into cell',
  props<{ value: string }>()
)

export const moveGenerator = createAction(
  '[SudokuLab.generator] move selection on direction',
  props<{ direction: string }>()
)

export const updateGeneratorSchema = createAction(
  '[SudokuLab.generator] update active schema',
  props<{ changes: Partial<EditSudoku> }>()
);

export const checkGeneratorState = createAction(
  '[SudokuLab.generator] check the schema state'
);

export const setGeneratorStatus = createAction(
  '[SudokuLab.generator] set generator engine status',
  props<{ active: boolean }>()
);

export const stopGeneratorRequest = createAction(
  '[SudokuLab.generator] stop generator engine request'
);

export const addSchema = createAction(
  '[SudokuLab.generator] add a new schema',
  props<{ schema: Sudoku }>()
);

export const generateSchema = createAction(
  '[SudokuLab.generator] generate schema with defined options'
);

export const clearGeneratedSchemas = createAction(
  '[SudokuLab.generator] clear all schemas'
);

export const downloadGeneratedSchemas = createAction(
  '[SudokuLab.generator] download all schemas'
);

export const downloadActiveGeneratorSchema = createAction(
  '[SudokuLab.generator] download active generator schema'
);

export const openSchemaInLab = createAction(
  '[SudokuLab.generator] open schema in lab',
  props<{ schema: Sudoku }>()
);

export const setWorkingInfo = createAction(
  '[SudokuLab.generator] set the working info',
  props<{ info: WorkingInfo|undefined }>()
);

export const loadGeneratorSchema = createAction(
  '[SudokuLab.generator] load a schema in generator',
  props<{ schema: Sudoku }>()
);
