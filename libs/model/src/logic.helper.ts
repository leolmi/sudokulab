import { reduce as _reduce, remove as _remove } from 'lodash';
import { ApplySudokuRulesOptions, CheckAvailableOptions, DEFAULT_RANK, SudokuCell } from './lib';
import { forEachGroup, isNumberCellValue } from './model.helper';
import { checkSudokuErrors } from './errors.helper';

/**
 * restituisce la mappa dei valori presenti contandoli
 * ````
 * { vN: { cid1:true, ..., cidK: true }, ... }
 * ````
 * @param cells
 */
export const getCellsValuesMap = (cells: SudokuCell[]) => {
  return _reduce(cells, (m, c) => isNumberCellValue(c.text) ? ({
    ...m,
    [c.text]: {
      ...(m[c.text]||{}),
      [c.id]: true
    }
  }) : m, <any>{});
}

/**
 * Restituisce l'array dei valori (stringa) possibili secondo il rank dello schema passato
 * @param rank
 */
export const getAvailable = (rank = DEFAULT_RANK): string[] =>
  Array(rank).fill(0).map((x, i) => `${(i+1)}`);


/**
 * resetta la collezione dei valori possibili
 * @param cells
 */
export const resetAvailable = (cells: SudokuCell[]) => {
  cells.forEach(c => c.available = (c.isFixed) ? [] : getAvailable());
}

/**
 * applica le regole base del sudoku:
 * - ogni gruppo (riga|colonna|quadrato) deve contenere tutti i numeri da 1-rank senza ripetizioni
 * @param cells
 * @param options
 */
export const applySudokuRules = (cells: SudokuCell[], options?: ApplySudokuRulesOptions) => {
  if (options?.resetBefore) resetAvailable(cells);
  // per ogni cella del gruppo
  forEachGroup(cells, (gcells) => {
    const vm = getCellsValuesMap(gcells);
    // elimina dai valori possibili quelli già presenti nel gruppo stesso
    gcells.forEach(c => isNumberCellValue(c.text) ?
      c.available = [] :
      _remove(c.available, av => !!vm[av]));
  });
}

/**
 * verifica i valori possibili per le celle non ancora valorizzate
 * @param cells
 * @param options
 */
export const checkStatus = (cells?: SudokuCell[], options?: CheckAvailableOptions) => {
  if (!cells) return;
  // verifica i valori possibili
  applySudokuRules(cells, options);
  // verifica gli errori nello schema
  checkSudokuErrors(cells, options);
}
