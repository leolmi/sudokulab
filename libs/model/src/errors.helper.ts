import { ErrorsContainer, SDK_PREFIX, Sudoku, SudokuCell, SudokuError, SudokuEx } from './lib';
import { clearObject } from './generic.helper';
import { keys as _keys } from 'lodash';
import { cellHasErrors } from './model.helper';


const _getErrorMessage = (error?: SudokuError): string => `[${error?.code||'?'}] ${error?.message||'???'}`;

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
