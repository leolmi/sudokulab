import {Action, createReducer} from "@ngrx/store";

export interface GeneratorState {
  activeCell: string;
}

export const initialState: GeneratorState = {
  activeCell: ''
};

const generatorReducers = createReducer(
  initialState
);

export function reducer(state: GeneratorState | undefined, action: Action) {
  return generatorReducers(state, action);
}
