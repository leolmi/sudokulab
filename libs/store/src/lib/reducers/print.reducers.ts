import { Action, createReducer, on } from '@ngrx/store';
import { PrintPage } from '@sudokulab/model';
import * as SudokuActions from '../actions';

export interface PrintState {
  pages: PrintPage[],
  activeArea: string
}

export const initialState: PrintState = {
  pages: [new PrintPage()],
  activeArea: ''
}

const printReducers = createReducer(
  initialState,
  on(SudokuActions.setPrintPages, (state, { pages }) => ({ ...state, pages })),
  on(SudokuActions.setActiveArea, (state, { area }) => ({ ...state, activeArea: area }))
)

export function reducer(state: PrintState | undefined, action: Action) {
  return printReducers(state, action);
}
