import {GeneratorUserData, SDK_GENERATOR_USER_DATA_KEY} from "../generator.model";
import {EditSudokuOptions} from "../EditSudokuOptions";
import {EditSudoku} from "../EditSudoku";
import {getValues} from "../../sudoku.helper";
import {extend as _extend, isFunction as _isFunction} from 'lodash';

const _memory: GeneratorUserData = new GeneratorUserData();
let IS_LOG_WARN_001 = false;

/**
 * carica i dati utente del generatore
 */
export const getGeneratorUserData = (): GeneratorUserData => {
  if (!_isFunction(localStorage?.getItem)) {
    if (!IS_LOG_WARN_001) {
      console.warn('cannot use localStorage to persist user data');
      IS_LOG_WARN_001 = true;
    }
    return _memory;
  }
  const udata_str = localStorage.getItem(SDK_GENERATOR_USER_DATA_KEY);
  let udata: any;
  if (udata_str) {
    try {
      udata = JSON.parse(udata_str);
    } catch (err) {
      console.warn('cannot read user data for generator', err);
    }
  }
  return new GeneratorUserData(udata);
}

/**
 * salva i dati utente
 * @param sdk
 * @param options
 */
export const saveGeneratorUserData = (sdk: EditSudoku, options: EditSudokuOptions): void => {
  const ud = new GeneratorUserData({values: getValues(sdk), options});
  if (!_isFunction(localStorage?.setItem)) {
    if (!IS_LOG_WARN_001) {
      console.warn('cannot use localStorage to persist user data');
      IS_LOG_WARN_001 = true;
    }
    _extend(_memory, ud);
  } else {
    localStorage.setItem(SDK_GENERATOR_USER_DATA_KEY, JSON.stringify(ud));
  }
}
