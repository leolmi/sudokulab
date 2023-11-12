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
  status.generated = status.total - (status.fixed + status.dynamics);
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
 * Restituisce la modalità del generatore:
 * - **single**: singolo schema, non richiede operazioni di generazione ma solo puro calcolo risolutivo poicé
 * ha solo nomeri fissi;
 * - **fixed**: gli schemi sono gerati sulla base delle possibili combinazioni dei possibili valori dinamici
 * - **multiple**: il generatore deve aggiungere valori fissi possibili secondo le logiche definite per raggiungere
 * il numero di numeri fissi richiesti, in questa casistica sono presenti cicli di valorizzazione aggiuntivi a quelli
 * dei numeri dinamici;
 * - **unknown**: non è possibile determinare la modalità di generazione degli schemi;
 * @param status
 */
export const getGenerationMode = (status: GeneratorStatus): GeneratorMode => {
  // **single**: singolo schema, non richiede operazioni di generazione
  // ma solo puro calcolo risolutivo poicé ha solo nomeri fissi
  if (status.total === status.fixed) return GeneratorMode.single;

  // **fixed**: gli schemi sono gerati sulla base delle possibili combinazioni
  // dei possibili valori dinamici
  if (status.total === (status.dynamics+status.fixed)) return GeneratorMode.fixed;

  // **multiple**: il generatore deve aggiungere valori fissi possibili secondo
  // le logiche definite per raggiungere il numero di numeri fissi richiesti,
  // in questa casistica sono presenti cicli di valorizzazione aggiuntivi a quelli
  // dei numeri dinamici.
  if (status.total > (status.dynamics+status.fixed)) return GeneratorMode.multiple;

  // **unknown**: non è possibile determinare la modalità di generazione degli schemi
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
