import { Action, createReducer, on } from '@ngrx/store';
import { EditSudoku, loadSchema, Sudoku, update, WorkingInfo } from '@sudokulab/model';
import * as GeneratorActions from '../actions';
import { cloneDeep as _clone } from 'lodash';


export interface GeneratorState {
  schema: EditSudoku;
  activeCell: string;
  running: boolean;
  stopping: boolean;
  outputSchemas: Sudoku[];
  workingInfo?: WorkingInfo;
}

export const initialState: GeneratorState = {
  schema: new EditSudoku(),
  activeCell: '',
  running: false,
  stopping: false,
  outputSchemas: [],
  workingInfo: undefined
};

export function reducer(state: GeneratorState | undefined, action: Action) {

  const generatorReducers = createReducer(
    initialState,
    on(GeneratorActions.setActiveGeneratorCell, (state, { id }) => ({ ...state, activeCell: id })),
    on(GeneratorActions.updateGeneratorSchema, (state, { changes }) => ({ ...state, schema: update(state.schema, changes) })),
    on(GeneratorActions.setGeneratorStatus, (state, { active }) => ({ ...state, running: active, stopping: false })),
    on(GeneratorActions.stopGeneratorRequest, (state) => ({ ...state, stopping: true })),
    on(GeneratorActions.addSchema, (state, { schema }) => {
      const outputSchemas = _clone(state.outputSchemas);
      outputSchemas.push(schema);
      return ({ ...state, outputSchemas });
    }),
    on(GeneratorActions.clearGeneratedSchemas, (state) => ({ ...state, outputSchemas: [] })),
    on(GeneratorActions.setWorkingInfo, (state, { info }) => ({ ...state, workingInfo: info }))
  );
  return generatorReducers(state, action);
}
