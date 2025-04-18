import {
  Algorithm,
  DIFFICULTY_RANGES,
  EndGenerationMode,
  GeneratorOptions,
  getStat,
  SudokuCell,
  Symmetry,
  ValorizationMode
} from '@olmi/model';
import { keys as _keys, reduce as _reduce } from 'lodash';

export const AVAILABLE_SYMMETRIES = _keys(Symmetry).map(ss => ({
  description: ss,
  code: ss
}));

export const AVAILABLE_DIFFICULTIES = [{
  code: undefined,
  description: 'undefined'
}, ...(DIFFICULTY_RANGES.map(r => ({
  description: r.label.toLowerCase(),
  code: r.label
})))];

export const AVAILABLE_STOP_MODES = [{
  code: EndGenerationMode.manual,
  description: 'manual'
}, {
  code: EndGenerationMode.afterN,
  description: 'after N schemas'
}, {
  code: EndGenerationMode.afterTime,
  description: 'after N seconds'
}];

export const AVAILABLE_VALUES_MODES = [{
  code: ValorizationMode.auto,
  description: 'auto'
},{
  code: ValorizationMode.sequential,
  description: 'sequential'
}, {
  code: ValorizationMode.random,
  description: 'random'
}];


/**
 * vero se il numero dei valori fissi e dinamici e minore dei valori
 * fissi totali che si vogliono presenti negli schemi generati
 * @param cells
 * @param options
 */
export const isMultischema = (cells: SudokuCell[], options: GeneratorOptions): boolean => {
  const stat = getStat(cells);
  return stat.fixedAndDynamicCount < options.fixedCount;
}

/**
 * ero se il numero dei valori fissi e dinamici e minore dei valori
 * fissi totali che si vogliono presenti negli schemi generati oppure
 * se sono presenti numeri dinamici
 * @param cells
 * @param options
 */
export const hasNewOrDynamicFixed = (cells: SudokuCell[], options: GeneratorOptions): boolean => {
  const stat = getStat(cells);
  return stat.fixedAndDynamicCount < options.fixedCount || stat.dynamicCount > 0;
}


export const getAlgorithmsMap = (algorithms: Algorithm[], used: string[]): any => {
  return _reduce(algorithms, (m, a) =>
    ({ ...m, [a.id]: (used || []).includes(a.id) }), <any>{});
}
