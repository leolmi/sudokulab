import {createSelector} from '@ngrx/store';
import {selectFeature} from '../common';
import {adapter} from '../reducers/lab.reducers';
import { PlaySudoku, SchemasOptions, SolveStepResult } from '@sudokulab/model';
import { Dictionary } from '@ngrx/entity';

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

export const selectSelectedSudoku = createSelector(
  selectLab,
  selectEntities,
  (state, entities): PlaySudoku|undefined => (entities||{})[state.selected||'']
)

export const selectActiveCell = createSelector(
  selectLab,
  (state): string => state.activeCell
)

export const selectActiveSchemasOptions = createSelector(
  selectLab,
  (state): SchemasOptions => state.options
)

export const selectActiveSchemaStepInfos = createSelector(
  selectLab,
  (state): SolveStepResult[] => state.stepInfos
)

export const selectHighlightCells = createSelector(
  selectLab,
  (state): Dictionary<boolean> => state.highlight
)
