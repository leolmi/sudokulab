import {
  getUserSetting,
  SUDOKULAB_DEFAULT_THEME, SUDOKULAB_DEFAULT_VALUES_MODE,
  SudokulabInfo,
  SudokulabPage,
  SudokuMessage,
  update
} from '@sudokulab/model';
import { Action, createReducer, on } from '@ngrx/store';
import * as SudokuActions from '../actions';
import { Dictionary } from '@ngrx/entity';
import {Observable} from "rxjs";

export interface SudokuState {
  info?: SudokulabInfo,
  activePage?: SudokulabPage,
  message?: SudokuMessage;
  status: Dictionary<boolean>;
  theme: string;
  valuesMode: string;
  token?: string;
  operationStatus?: number;
  env?: any;
  settings?: any;
  loadedSchemas: boolean
}

export const initialState: SudokuState = {
  info: undefined,
  activePage: undefined,
  message: undefined,
  status: {},
  theme: getUserSetting('sudoku.theme')||SUDOKULAB_DEFAULT_THEME,
  valuesMode: getUserSetting('sudoku.valuesMode')||SUDOKULAB_DEFAULT_VALUES_MODE,
  token: undefined,
  operationStatus: -1,
  env: {},
  settings: getUserSetting('lab.activeSudoku')||{},
  loadedSchemas: false
};

const sudokuReducers = createReducer(
  initialState,
  on(SudokuActions.loadedSchemas, (state) => state.loadedSchemas ? state : { ...state, loadedSchemas: true }),
  on(SudokuActions.setAppInfo, (state, { info }) => ({ ...state, info })),
  on(SudokuActions.setActiveMessage, (state, { message }) => ({ ...state, message })),
  on(SudokuActions.setActivePage, (state, { page }) => ({ ...state, activePage: page })),
  on(SudokuActions.updatePageStatus, (state, { status }) => ({ ...state, status: update(state.status, status) })),
  on(SudokuActions.setTheme, (state, { theme }) => ({ ...state, theme })),
  on(SudokuActions.setValuesMode, (state, { valuesMode }) => ({ ...state, valuesMode })),
  on(SudokuActions.setToken, (state, { token }) => ({ ...state, token })),
  on(SudokuActions.setOperationStatus, (state, { status }) => ({ ...state, operationStatus: status })),
  on(SudokuActions.setEnvironment, (state, { env }) => ({ ...state, env })),
  on(SudokuActions.updateUserSettings, (state) => ({ ...state, settings: getUserSetting('lab.activeSudoku')||{} })),
);

export function reducer(state: SudokuState | undefined, action: Action) {
  return sudokuReducers(state, action);
}
