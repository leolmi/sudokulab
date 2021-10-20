import { getUserSetting, SUDOKULAB_DEFAULT_THEME, SudokulabPage, SudokuMessage, update } from '@sudokulab/model';
import {Action, createReducer, on} from '@ngrx/store';
import * as SudokuActions from '../actions';
import { Dictionary } from '@ngrx/entity';

export interface SudokuState {
  activePage?: SudokulabPage,
  message?: SudokuMessage;
  status: Dictionary<boolean>;
  theme: string;
  token?: string;
  operationStatus?: number;
}

export const initialState: SudokuState = {
  activePage: undefined,
  message: undefined,
  status: {},
  theme: getUserSetting('sudoku.theme')||SUDOKULAB_DEFAULT_THEME,
  token: undefined,
  operationStatus: -1
};

const sudokuReducers = createReducer(
  initialState,
  on(SudokuActions.setActiveMessage, (state, { message }) => ({ ...state, message })),
  on(SudokuActions.setActivePage, (state, { page }) => ({ ...state, activePage: page })),
  on(SudokuActions.updatePageStatus, (state, { status }) => ({ ...state, status: update(state.status, status) })),
  on(SudokuActions.setTheme, (state, { theme }) => ({ ...state, theme })),
  on(SudokuActions.setToken, (state, { token }) => ({ ...state, token })),
  on(SudokuActions.setOperationStatus, (state, { status }) => ({ ...state, operationStatus: status }))
);

export function reducer(state: SudokuState | undefined, action: Action) {
  return sudokuReducers(state, action);
}
