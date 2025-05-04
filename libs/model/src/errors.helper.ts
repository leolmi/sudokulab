import {
  CheckErrorsOptions,
  ErrorNoValueForCell,
  ErrorsContainer,
  ErrorWrongCellValue,
  Sudoku,
  SudokuCell,
  SudokuError,
  SudokuEx,
} from './lib';
import { clearObject } from './generic.helper';
import { keys as _keys, values as _values } from 'lodash';
import {
  cellHasErrors,
  forEachGroup,
  isDynamicValue,
  onCell,
} from './model.helper';
import { getCellsValuesMap } from './logic.helper';

const _getErrorMessage = (error?: SudokuError): string =>
  `[${error?.code || '?'}] ${error?.message || '???'}`;

const ERRORS: any = {};

const _notifyErrorOneTime = (error: SudokuError) => {
  const message = _getErrorMessage(error);
  if (ERRORS[message]) return;
  ERRORS[message] = true;
  // console.warn(...SDK_PREFIX, message);
}

/**
 * aggiunge l'errore all'elenco (sulla stessa cella non possono essere presenti
 * più errori con lo stesso codice)
 * @param container
 * @param error
 * @param clear
 */
export const addError = (container: ErrorsContainer|undefined, error: SudokuError, clear = false): ErrorsContainer => {
  if (clear && container) clearObject(container);
  container = container || {};
  container[error.code] = error;

  _notifyErrorOneTime(error);
  return container;
}


/**
 * restituisce il messaggio d'errore complessivo per il container
 * @param container
 */
export const getErrorMessage = (container?: ErrorsContainer): string => {
  return _keys(container||{})
    .map(k => _getErrorMessage((container||{})[k]))
    .filter(m => !!m)
    .join('\n');
}

/**
 * restituisce il messaggio d'errore complessivo
 * @param sdk
 */
export const getGlobalErrorMessage = (sdk?: Sudoku): string => {
  return ((<SudokuEx>sdk)?.cells||[])
    .map(c => getErrorMessage(c.error))
    .filter(m => !!m)
    .join('\n');
}

/**
 * vero almeno un errore è presente
 * @param cells
 */
export const hasErrors = (cells?: SudokuCell[]): boolean =>
  !!(cells||[]).find(c => cellHasErrors(c));


/**
 * verifica gli errori presenti nelle celle
 * @param cells
 * @param options
 */
export const checkSudokuErrors = (cells: SudokuCell[], options?: CheckErrorsOptions) => {
  // resetta gli errori e ricerca errori per cella
  cells.forEach(c => {
    delete c.error;
    // ERROR: cella senza valori possibili
    if (!c.isFixed && (!c.text || isDynamicValue(c.text)) && c.available.length<1)
      c.error = addError(c.error, new ErrorNoValueForCell({ cid:c.id }));
  });

  // errori sui gruppi
  forEachGroup(cells, (gcells) => {
    const vm = getCellsValuesMap(gcells);
    _values(vm).forEach((v: any) => {
      const cids = _keys(v);
      if (cids.length > 1) cids.forEach(cid => {
        // celle con stesso valore nel gruppo
        onCell(cells, cid, (c) => {
          if (options?.schemaMode || (!c.isFixed && !c.isDynamic)) {
            c.error = addError(c.error, new ErrorWrongCellValue({ cid:c.id }))
          }
        });
      })
    })
  });
}
