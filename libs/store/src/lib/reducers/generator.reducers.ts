import {Action, createReducer} from "@ngrx/store";
import { EditSudoku } from "@sudokulab/model";

export interface GeneratorState {
  schema: EditSudoku;
  activeCell: string;
}

export const initialState: GeneratorState = {
  schema: new EditSudoku(),
  activeCell: ''
};

const generatorReducers = createReducer(
  initialState
);

export function reducer(state: GeneratorState | undefined, action: Action) {
  return generatorReducers(state, action);
}
