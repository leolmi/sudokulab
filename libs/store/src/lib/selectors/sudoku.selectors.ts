import {createSelector} from '@ngrx/store';
import {selectFeature} from '../common';
import {SudokulabPage, SudokuMessage} from '@sudokulab/model';

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
