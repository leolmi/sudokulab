import { createSelector } from '@ngrx/store';
import { selectFeature } from '../common';
import { SudokulabInfo, SudokulabPage, SudokuMessage } from '@sudokulab/model';
import { Dictionary } from '@ngrx/entity';

export const selectSudoku = createSelector(
  selectFeature,
  state => state.sudoku
)

export const selectAppInfo = createSelector(
  selectSudoku,
  (state): SudokulabInfo|undefined => state.info
)

export const selectActiveMessage = createSelector(
  selectSudoku,
  (state): SudokuMessage|undefined => state.message
)

export const selectActivePage = createSelector(
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

export const selectToken = createSelector(
  selectSudoku,
  (state): string => state.token||''
)

export const selectOperationStatus = createSelector(
  selectSudoku,
  (state): number => state.operationStatus||-1
)

export const selectEnvironment = createSelector(
  selectSudoku,
  (state): any => state.env
)


