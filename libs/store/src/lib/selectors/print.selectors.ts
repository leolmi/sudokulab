import { createSelector } from '@ngrx/store';
import { PrintPage } from '@sudokulab/model';
import { selectFeature } from '../common';

export const selectPrint = createSelector(
  selectFeature,
  state => state.print
)


export const selectActiveArea = createSelector(
  selectPrint,
  (state): string => state.activeArea
)

export const selectPrintPages = createSelector(
  selectPrint,
  (state): PrintPage[] => state.pages||[]
)
