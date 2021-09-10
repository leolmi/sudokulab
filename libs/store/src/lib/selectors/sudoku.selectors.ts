import { createSelector } from '@ngrx/store';
import { selectFeature } from '../common';
import { adapter } from '../reducers/sudoku.reducers';
import {PlaySudoku, SudokulabPage, SudokuMessage} from '@sudokulab/model';

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

export const selectActiveMessage= createSelector(
  selectSudokus,
  (state): SudokuMessage|undefined => state.message
)

export const selectActivePage= createSelector(
  selectSudokus,
  (state): SudokulabPage|undefined => state.activePage
)
