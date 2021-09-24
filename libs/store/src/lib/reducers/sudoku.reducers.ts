import { SudokulabPage, SudokuMessage, update } from '@sudokulab/model';
import {Action, createReducer, on} from '@ngrx/store';
import * as SudokuActions from '../actions';
import { Dictionary } from '@ngrx/entity';

export interface SudokuState {
  activePage?: SudokulabPage,
  message?: SudokuMessage;
  status: Dictionary<boolean>;
}

export const initialState: SudokuState = {
  activePage: undefined,
  message: undefined,
  status: {}
};

const sudokuReducers = createReducer(
  initialState,
  on(SudokuActions.setActiveMessage, (state, { message }) => ({ ...state, message })),
  on(SudokuActions.setActivePage, (state, { page }) => ({ ...state, activePage: page })),
  on(SudokuActions.updatePageStatus, (state, { status }) => ({ ...state, status: update(state.status, status) }))
);

export function reducer(state: SudokuState | undefined, action: Action) {
  return sudokuReducers(state, action);
}
