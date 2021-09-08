import { createSelector } from '@ngrx/store';
import { selectFeature } from '../common';
import { adapter } from '../reducers/sudoku.reducers';
import { PlaySudoku } from '@sudokulab/model';

export const selectSudokus = createSelector(
  selectFeature,
  state => state.sudoku
)

const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors(selectSudokus);


export const selectAllSudoku = createSelector(
  selectAll,
  all => all
)

export const selectActiveSudoku = createSelector(
  selectSudokus,
  selectEntities,
  (state, entities): PlaySudoku|undefined => (entities||{})[state.active||'']
)

export const selectActiveCell = createSelector(
  selectSudokus,
  (state): string => state.activeCell
)
