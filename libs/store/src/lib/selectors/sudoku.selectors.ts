import { createSelector } from '@ngrx/store';
import { selectFeature } from '../common';
import { SudokulabPage, SudokuMessage } from '@sudokulab/model';
import { Dictionary } from '@ngrx/entity';

export const selectSudoku = createSelector(
  selectFeature,
  state => state.sudoku
)

export const selectActiveMessage= createSelector(
  selectSudoku,
  (state): SudokuMessage|undefined => state.message
)

export const selectActivePage= createSelector(
  selectSudoku,
  (state): SudokulabPage|undefined => state.activePage
)

export const selectPageStatus = createSelector(
  selectSudoku,
  (state): Dictionary<boolean> => state.status
)

export const selectTheme = createSelector(
  selectSudoku,
  (state): string => state.theme
)
