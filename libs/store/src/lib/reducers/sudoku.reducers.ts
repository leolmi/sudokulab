import {SudokulabPage, SudokuMessage} from '@sudokulab/model';
import {Action, createReducer, on} from '@ngrx/store';
import * as SudokuActions from '../actions';

export interface SudokuState {
  activePage?: SudokulabPage,
  message?: SudokuMessage;
}

export const initialState: SudokuState = {
  activePage: undefined,
  message: undefined
};

const sudokuReducers = createReducer(
  initialState,
  on(SudokuActions.setActiveMessage, (state, { message }) => ({ ...state, message })),
  on(SudokuActions.setActivePage, (state, { page }) => ({ ...state, activePage: page }))
);

export function reducer(state: SudokuState | undefined, action: Action) {
  return sudokuReducers(state, action);
}
