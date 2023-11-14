import {GeneratorStatus, getGeneratorStatus, PlaySudoku} from "@sudokulab/model";
import {cloneDeep as _clone, extend as _extend, keys as _keys} from 'lodash';

export interface SchemaGeneraionResult {
  sdk?: PlaySudoku;
}

export interface SchemaGenerationOptions {
  cache?: any;
  maxCyclesCount?: number;
}

/**
 * aggiunge una (o più celle dinamiche) secondo quante ne mancano
 * e secondo le logiche di generazione
 * @param sdk
 */
const _addDynamicCell = (sdk: PlaySudoku): GeneratorStatus => {
  const status = getGeneratorStatus(sdk);

  // TODO ...
  console.log('STATUS', status);

  return status;
}

export const generateSchema = (sdk?: PlaySudoku, options?: SchemaGenerationOptions): SchemaGeneraionResult => {
  const res: SchemaGeneraionResult = {};
  if (sdk) {
    res.sdk = _clone(sdk);
    let status: GeneratorStatus;
    do {
      status = _addDynamicCell(res.sdk);
    } while (status.generated > 0);
  }
  return res;
}
