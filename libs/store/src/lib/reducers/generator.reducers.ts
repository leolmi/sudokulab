import { Action, createReducer, on } from '@ngrx/store';
import { EditSudoku, Sudoku, update } from '@sudokulab/model';
import * as GeneratorActions from '../actions';
import { cloneDeep as _clone } from 'lodash';
import { clearGeneratedSchemas } from '../actions';

export interface GeneratorState {
  schema: EditSudoku;
  activeCell: string;
  running: boolean;
  stopping: boolean;
  outputSchemas: Sudoku[];
}

export const initialState: GeneratorState = {
  schema: new EditSudoku(),
  activeCell: '',
  running: false,
  stopping: false,
  outputSchemas: []
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
    on(GeneratorActions.clearGeneratedSchemas, (state) => ({ ...state, outputSchemas: [] }))
  );
  return generatorReducers(state, action);
}
