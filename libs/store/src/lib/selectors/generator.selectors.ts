import {createSelector} from '@ngrx/store';
import {selectFeature} from '../common';
import {EditSudoku} from '@sudokulab/model';


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