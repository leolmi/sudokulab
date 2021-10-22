import {
  getUserSetting,
  SUDOKULAB_DEFAULT_THEME,
  SudokulabInfo,
  SudokulabPage,
  SudokuMessage,
  update
} from '@sudokulab/model';
import { Action, createReducer, on } from '@ngrx/store';
import * as SudokuActions from '../actions';
import { Dictionary } from '@ngrx/entity';

export interface SudokuState {
  info?: SudokulabInfo,
  activePage?: SudokulabPage,
  message?: SudokuMessage;
  status: Dictionary<boolean>;
  theme: string;
  token?: string;
  operationStatus?: number;
  env?: any
}

export const initialState: SudokuState = {
  info: undefined,
  activePage: undefined,
  message: undefined,
  status: {},
  theme: getUserSetting('sudoku.theme')||SUDOKULAB_DEFAULT_THEME,
  token: undefined,
  operationStatus: -1,
  env: {}
};

const sudokuReducers = createReducer(
  initialState,
  on(SudokuActions.setAppInfo, (state, { info }) => ({ ...state, info })),
  on(SudokuActions.setActiveMessage, (state, { message }) => ({ ...state, message })),
  on(SudokuActions.setActivePage, (state, { page }) => ({ ...state, activePage: page })),
  on(SudokuActions.updatePageStatus, (state, { status }) => ({ ...state, status: update(state.status, status) })),
  on(SudokuActions.setTheme, (state, { theme }) => ({ ...state, theme })),
  on(SudokuActions.setToken, (state, { token }) => ({ ...state, token })),
  on(SudokuActions.setOperationStatus, (state, { status }) => ({ ...state, operationStatus: status })),
  on(SudokuActions.setEnvironment, (state, { env }) => ({ ...state, env }))
);

export function reducer(state: SudokuState | undefined, action: Action) {
  return sudokuReducers(state, action);
}
