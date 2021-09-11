import {createAction, props} from "@ngrx/store";

export const setActiveGeneratorCell = createAction(
  '[SudokuPlay.generator] set the active cell of generator',
  props<{ id: string }>()
);

export const clearGenerator = createAction(
  '[SudokuPlay.generator] clear the sudoku generator schema'
);
