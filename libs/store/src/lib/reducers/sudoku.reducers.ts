import {checkAvailables, PlaySudoku, SudokulabPage, SudokuMessage} from '@sudokulab/model';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import * as SudokuActions from '../actions';

export interface SudokuState extends EntityState<PlaySudoku> {
  active: string;
  activeCell: string;
  activePage?: SudokulabPage,
  message?: SudokuMessage;
}

export const adapter: EntityAdapter<PlaySudoku> = createEntityAdapter<PlaySudoku>();

export const initialState: SudokuState = adapter.getInitialState({
  active: '',
  activeCell: '',
  activePage: undefined,
  message: undefined
});

const sudokuReducers = createReducer(
  initialState,
  on(SudokuActions.loadSudoku, (state, { sudoku }) => {
    const psdk = new PlaySudoku({ sudoku });
    checkAvailables(psdk);
    return { ...adapter.upsertOne(psdk, state), active: sudoku.id, activeCell: '' };
  }),
  on(SudokuActions.updateSudoku, (state, { changes }) => adapter.updateOne({ id: changes.id||'', changes }, state)),
  on(SudokuActions.setActiveSudoku, (state, { active }) => ({ ...state, active, activeCell:'' })),
  on(SudokuActions.setActiveCell, (state, { id }) => ({ ...state, activeCell: id })),
  on(SudokuActions.setActiveMessage, (state, { message }) => ({ ...state, message })),
  on(SudokuActions.setActivePage, (state, { page }) => ({ ...state, activePage: page }))
);

export function reducer(state: SudokuState | undefined, action: Action) {
  return sudokuReducers(state, action);
}
