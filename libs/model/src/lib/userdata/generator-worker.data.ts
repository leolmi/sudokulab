import {GeneratorUserData, SDK_GENERATOR_USER_DATA_KEY} from "../generator.model";
import {getValues, resetAvailable} from "../../sudoku.helper";
import {extend as _extend, isFunction as _isFunction} from 'lodash';
import {PlaySudoku} from "../PlaySudoku";
import {DEFAULT_GENERATOR_OPITIONS, GeneratorData} from "../tokens";
import {Sudoku} from "../Sudoku";
import {PlaySudokuOptions} from "../PlaySudokuOptions";
import {checkAvailable} from "../logic";

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
 */
export const saveGeneratorUserData = (sdk: PlaySudoku): void => {
  const ud = new GeneratorUserData({values: getValues(sdk), options: sdk.options});
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

const _getUserDataSdk = (data: GeneratorUserData): PlaySudoku => {
  const sdk = new PlaySudoku({
    sudoku: new Sudoku({fixed: data.values}),
    options: new PlaySudokuOptions(DEFAULT_GENERATOR_OPITIONS)
  });
  if (data?.options) _extend(sdk.options, {
    ...data.options,
    ...DEFAULT_GENERATOR_OPITIONS
  });
  return sdk;
}

/**
 * carica i dati utente del generatore
 * @param generator
 */
export const loadGeneratorUserData = (generator: GeneratorData): void => {
  const udata = getGeneratorUserData();
  const sdk = _getUserDataSdk(udata);
  resetAvailable(sdk);
  checkAvailable(sdk, { fixedAsValue: true });
  generator.sdk$.next(sdk);
}
