import {createSelector} from '@ngrx/store';
import {selectFeature} from '../common';
import {adapter} from '../reducers/lab.reducers';
import { PlaySudoku, SchemasOptions, SolveStepResult } from '@sudokulab/model';

export const selectLab = createSelector(
  selectFeature,
  state => state.lab
)

const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors(selectLab);


export const selectAllSudoku = createSelector(
  selectAll,
  all => all
)

export const selectActiveSudoku = createSelector(
  selectLab,
  selectEntities,
  (state, entities): PlaySudoku|undefined => (entities||{})[state.active||'']
)

export const selectActiveCell = createSelector(
  selectLab,
  (state): string => state.activeCell
)

export const selectActiveSchemasOptions = createSelector(
  selectLab,
  (state): SchemasOptions => state.options
)

export const selectActiveSchemaStepInfo = createSelector(
  selectLab,
  (state): SolveStepResult|undefined => state.stepInfo
)
