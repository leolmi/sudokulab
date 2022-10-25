import {
  checkAvailables,
  getUserSetting,
  PlaySudoku,
  SchemasOptions,
  SolveStepResult, Sudoku,
  update
} from '@sudokulab/model';
import { createEntityAdapter, Dictionary, EntityAdapter, EntityState } from '@ngrx/entity';
import {Action, createReducer, on} from '@ngrx/store';
import * as SudokuActions from '../actions';
import { reduce as _reduce, cloneDeep as _clone, extend as _extend } from 'lodash';

export interface LabState extends EntityState<PlaySudoku> {
  active: number;
  selected: number;
  activeCell: string;
  options: SchemasOptions;
  stepInfos: SolveStepResult[];
  highlight: Dictionary<boolean>;
}

export const adapter: EntityAdapter<PlaySudoku> = createEntityAdapter<PlaySudoku>({
  selectId: (s) => s._id
});

export const initialState: LabState = adapter.getInitialState({
  active: parseInt(getUserSetting<string>('lab.activeSudokuId')||'0')||0,
  selected: 0,
  activeCell: '',
  options: new SchemasOptions(getUserSetting('lab.schemasOptions')),
  stepInfos: [],
  highlight: {}
});

const labReducers = createReducer(
  initialState,
  on(SudokuActions.loadSchemas, (state, { schemas }) => {
    const usersettings: any = getUserSetting<PlaySudoku>('lab.activeSudoku');
    schemas = _clone(schemas);
    schemas.forEach(sch => {
      const userschema = (usersettings || {})[sch._id];
      if (userschema) _extend(sch, userschema);
    });
    return adapter.upsertMany(schemas, state);
  }),
  on(SudokuActions.loadSudoku, (state, { sudoku }) => {
    const psdk = new PlaySudoku({ sudoku });
    checkAvailables(psdk);
    return adapter.upsertOne(psdk, state);
  }),
  on(SudokuActions.updateSudoku, (state, { changes }) => adapter.updateOne({ id: changes._id||0, changes }, state)),
  on(SudokuActions.setActiveSudoku, (state, { active }) => ({ ...state, active, activeCell:'' })),
  on(SudokuActions.setSelectedSudoku, (state, { selected }) => ({ ...state, selected })),
  on(SudokuActions.setActiveCell, (state, { id }) => ({ ...state, activeCell: id })),
  on(SudokuActions.setStepInfo, (state, { infos }) => ({ ...state, stepInfos: infos||[] })),
  on(SudokuActions.updateSchemasOptions, (state, { changes }) => ({ ...state, options: update(state.options, changes )})),
  on(SudokuActions.highlightCells, (state, { cells }) => {
    const hl: Dictionary<boolean> = _reduce(cells||[], (hld, c) => { hld[c] = true; return hld;}, <Dictionary<boolean>>{});
    return { ...state, highlight: hl };
  })
);

export function reducer(state: LabState | undefined, action: Action) {
  return labReducers(state, action);
}
