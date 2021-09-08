import { checkAvailables, PlaySudoku } from '@sudokulab/model';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import * as SudokuActions from '../actions';

export interface SudokuState extends EntityState<PlaySudoku> {
  active: string;
  activeCell: string;
}

export const adapter: EntityAdapter<PlaySudoku> = createEntityAdapter<PlaySudoku>();

export const initialState: SudokuState = adapter.getInitialState({
  active: '',
  activeCell: ''
});

const sudokuReducers = createReducer(
  initialState,
  on(SudokuActions.loadSudoku, (state, { sudoku }) => {
    const psdk = new PlaySudoku({ sudoku });
    checkAvailables(psdk);
    return adapter.upsertOne(psdk, state);
  }),
  on(SudokuActions.updateSudoku, (state, { changes }) => adapter.updateOne({ id: changes.id||'', changes }, state)),
  on(SudokuActions.setActiveSudoku, (state, { active }) => ({ ...state, active, activeCell:'' })),
  on(SudokuActions.setActiveCell, (state, { id }) => ({ ...state, activeCell: id })),
);

export function reducer(state: SudokuState | undefined, action: Action) {
  return sudokuReducers(state, action);
}
