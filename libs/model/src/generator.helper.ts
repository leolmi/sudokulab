import {GeneratorMode, GeneratorStatus, GeneratorUserData} from "./lib/generator.model";
import {EditSudoku} from "./lib/EditSudoku";
import {extend as _extend, forEach as _forEach} from 'lodash';
import {SUDOKU_DYNAMIC_VALUE, SUDOKU_DYNAMIC_VALUE2, SUDOKU_EMPTY_VALUE} from "./lib/consts";
import {getRank, isValidValue, loadValues, traverseSchema} from "./sudoku.helper";
import {Sudoku} from "./lib/Sudoku";
import {isValue} from "./global.helper";
import {PlaySudoku} from "./lib/PlaySudoku";

/**
 * valida lo status del generatore
 * @param status
 */
export const checkGeneratorStatus = (status: GeneratorStatus): void => {
  if (status.total < status.fixed + status.dynamics) status.total = status.fixed + status.dynamics;
  if (status.total < 10) status.total = 10;
}

/**
 * restituisce lo status del generatore
 * @param sdk
 */
export const getGeneratorStatus = (sdk: PlaySudoku): GeneratorStatus => {
  const status: GeneratorStatus = new GeneratorStatus({total: sdk.options.generator.fixedCount});
  _forEach(sdk.cells, (c) => {
    if (c?.value === SUDOKU_DYNAMIC_VALUE || c?.value === SUDOKU_DYNAMIC_VALUE2) {
      status.dynamics++;
    } else if (isValidValue(c?.value || '')) {
      status.fixed++;
    }
  });

  checkGeneratorStatus(status);
  status.mode = getGenerationMode(status);
  return status;
}

/**
 * restituisce la modalità del generatore
 * @param status
 */
export const getGenerationMode = (status: GeneratorStatus): GeneratorMode => {
  if (status.total === status.fixed) return GeneratorMode.single;
  if (status.total === (status.dynamics+status.fixed)) return GeneratorMode.fixed;
  if (status.total > (status.dynamics+status.fixed)) return GeneratorMode.multiple;
  return GeneratorMode.unknown;
}

const getFixedValues = (sdk: EditSudoku|PlaySudoku, allowX = false): string => {
  let fixed = '';
  traverseSchema(sdk, (cid) => {
    const raw_value = sdk.cells[cid]?.value || '';
    const value = isValue(raw_value) ? raw_value :
      (raw_value === SUDOKU_DYNAMIC_VALUE && allowX ? SUDOKU_DYNAMIC_VALUE : SUDOKU_EMPTY_VALUE);
    fixed = `${fixed || ''}${value}`;
  });
  return fixed;
}

/**
 * restituisce lo schema
 * @param sdk
 */
export const getSudoku = (sdk: EditSudoku|PlaySudoku): Sudoku => {
  return new Sudoku({
    rank: getRank(sdk),
    fixed: getFixedValues(sdk)
  });
}

/**
 * restituisce lo scema popolato dei valori
 * @param data
 */
export const getEditSudoku = (data: GeneratorUserData): EditSudoku => {
  const sdk = new EditSudoku();
  _extend(sdk.options, data.options);
  loadValues(sdk, data.values);
  return sdk;
}
