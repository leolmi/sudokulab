import { createAction, props } from '@ngrx/store';
import { PrintPage } from '@sudokulab/model';

export const setPrintPages = createAction(
  '[SudokuLab.print] set the print pages',
  props<{ pages: PrintPage[] }>()
);

export const setActiveArea = createAction(
  '[SudokuLab.print] set the active area',
  props<{ area: string }>()
);

export const print = createAction(
  '[SudokuLab.print] print'
);
