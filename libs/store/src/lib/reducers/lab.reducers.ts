import {
  checkAvailables,
  getUserSetting,
  PlaySudoku,
  SchemasOptions,
  SolveStepResult,
  update
} from '@sudokulab/model';
import { createEntityAdapter, Dictionary, EntityAdapter, EntityState } from '@ngrx/entity';
import {Action, createReducer, on} from '@ngrx/store';
import * as SudokuActions from '../actions';
import { reduce as _reduce } from 'lodash';

export interface LabState extends EntityState<PlaySudoku> {
  active: number;
  activeCell: string;
  options: SchemasOptions;
  stepInfo?: SolveStepResult;
  highlight: Dictionary<boolean>;
}

export const adapter: EntityAdapter<PlaySudoku> = createEntityAdapter<PlaySudoku>({
  selectId: (s) => s._id
});

export const initialState: LabState = adapter.getInitialState({
  active: 0,
  activeCell: '',
  options: new SchemasOptions(getUserSetting('lab.schemasOptions')),
  stepInfo: undefined,
  highlight: {}
});

const labReducers = createReducer(
  initialState,
  on(SudokuActions.loadSchemas, (state, { schemas }) => adapter.upsertMany(schemas, state)),
  on(SudokuActions.loadSudoku, (state, { sudoku }) => {
    const psdk = new PlaySudoku({ sudoku });
    checkAvailables(psdk);
    return adapter.upsertOne(psdk, state);
  }),
  on(SudokuActions.updateSudoku, (state, { changes }) => adapter.updateOne({ id: changes._id||0, changes }, state)),
  on(SudokuActions.setActiveSudoku, (state, { active }) => ({ ...state, active, activeCell:'' })),
  on(SudokuActions.setActiveCell, (state, { id }) => ({ ...state, activeCell: id })),
  on(SudokuActions.setStepInfo, (state, { info }) => ({ ...state, stepInfo: info })),
  on(SudokuActions.updateSchemasOptions, (state, { changes }) => ({ ...state, options: update(state.options, changes )})),
  on(SudokuActions.highlightCells, (state, { cells }) => {
    const hl: Dictionary<boolean> = _reduce(cells||[], (hld, c) => { hld[c] = true; return hld;}, <Dictionary<boolean>>{});
    return { ...state, highlight: hl };
  })
);

export function reducer(state: LabState | undefined, action: Action) {
  return labReducers(state, action);
}
