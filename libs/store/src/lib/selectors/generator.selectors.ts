import {createSelector} from '@ngrx/store';
import {selectFeature} from '../common';
import { EditSudoku, Sudoku, WorkingInfo } from '@sudokulab/model';
import { Dictionary } from '@ngrx/entity';


export const selectGenerator = createSelector(
  selectFeature,
  state => state.generator
)

export const selectActiveGeneratorSchema = createSelector(
  selectGenerator,
  (state): EditSudoku => state.schema
)

export const selectActiveGeneratorCell = createSelector(
  selectGenerator,
  (state): string => state.activeCell
)

export const selectActiveGeneratorIsRunning = createSelector(
  selectGenerator,
  (state): boolean => state.running
)

export const selectGeneratorIsStopping = createSelector(
  selectGenerator,
  (state): boolean => state.stopping
)

export const selectGeneratedSchemas = createSelector(
  selectGenerator,
  (state): Sudoku[] => state.outputSchemas||[]
)

export const selectGeneratorWorkingInfo = createSelector(
  selectGenerator,
  (state): WorkingInfo|undefined => state.workingInfo
)
