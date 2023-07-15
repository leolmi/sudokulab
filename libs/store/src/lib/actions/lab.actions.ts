import {createAction, props} from "@ngrx/store";
import { PlaySudoku, PlaySudokuOptions, SchemasOptions, SolveStepResult, Sudoku } from '@sudokulab/model';

export const setActiveSudoku = createAction(
  '[SudokuLab.lab] set the active sudoku',
  props<{ active: number }>()
);

export const setSelectedSudoku = createAction(
  '[SudokuLab.lab] set the selected sudoku',
  props<{ selected: number }>()
);

export const openSelectedSudoku = createAction(
  '[SudokuLab.lab] open the selected sudoku'
);

export const setActiveCell = createAction(
  '[SudokuLab.lab] set the active cell',
  props<{ id: string }>()
);

export const loadSudokuRequest = createAction(
  '[SudokuLab.lab] raise request to load a sudoku',
  props<{ sudoku: Sudoku, onlyValues?: boolean }>()
);

export const loadSudoku = createAction(
  '[SudokuLab.lab] load a sudoku',
  props<{ sudoku: Sudoku }>()
);

export const loadSchemas = createAction(
  '[SudokuLab.lab] load scehmas store',
  props<{ schemas: PlaySudoku[] }>()
);

export const loadedSchemas = createAction(
  '[SudokuLab.lab] schemas loaded'
);

export const clear = createAction(
  '[SudokuLab.lab] clear the sudoku'
);

export const updateSudoku = createAction(
  '[SudokuLab.lab] update active sudoku',
  props<{ changes: Partial<PlaySudoku> }>()
);

export const checkState = createAction(
  '[SudokuLab.lab] check the schema state'
);

export const applyAlgorithm = createAction(
  '[SudokuLab.lab] apply algorithm to active sudoku',
  props<{ algorithm: string }>()
);

export const stepInfo = createAction(
  '[SudokuLab.lab] show the next step info'
);

export const solveStep = createAction(
  '[SudokuLab.lab] try do a new solve step'
);

export const solve = createAction(
  '[SudokuLab.lab] try solve sudoku'
);

export const analyze = createAction(
  '[SudokuLab.lab] analyze sudoku'
);

export const setValue = createAction(
  '[SudokuLab.lab] set value into cell',
  props<{ value: string }>()
)

export const move = createAction(
  '[SudokuLab.lab] move selection on direction',
  props<{ direction: string }>()
)

export const dowloadSchema = createAction(
  '[SudokuLab.lab] download current schema'
);

export const updateSchemasOptions = createAction(
  '[SudokuLab.lab] update current schemas options',
  props<{ changes: Partial<SchemasOptions> }>()
);

export const updatePlayerOptions = createAction(
  '[SudokuLab.lab] update current player options',
  props<{ changes: Partial<PlaySudokuOptions> }>()
);

export const setStepInfo = createAction(
  '[SudokuLab.lab] set current step-info',
  props<{ infos?: SolveStepResult[] }>()
);

export const highlightCells = createAction(
  '[SudokuLab.lab] highlight cells',
  props<{ cells?: string[] }>()
);

export const copyAvailableToPencil = createAction(
  '[SudokuLab.lab] copy availables to pencil'
)

export const toggleAvailable = createAction(
  '[SudokuLab.lab] toggle available'
)

export const togglePopupDetails = createAction(
  '[SudokuLab.lab] toggle popup details'
)

export const setStepDetails = createAction(
  '[SudokuLab.lab] set current step-info',
  props<{ steps?: SolveStepResult[] }>()
);

export const calcAvailables = createAction(
  '[SudokuLab.lab] reset availables',
  props<{ reset: boolean }>()
);

