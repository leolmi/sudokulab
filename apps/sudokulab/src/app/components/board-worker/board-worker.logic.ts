import {
  checkAvailables,
  clear, isValidValue,
  MessageType,
  PlaySudoku, PlaySudokuCell, PlaySudokuOptions,
  resetAvailable,
  Solver,
  SudokuMessage,
  toggleValue
} from "@sudokulab/model";
import {extend as _extend} from "lodash";

/**
 * verifica lo schema
 * @param sdk
 */
export const checkSchema = (sdk: PlaySudoku): boolean => {
  resetAvailable(sdk);
  checkAvailables(sdk);
  return true;
}


/**
 * risolve lo schema
 * @param sdk
 */
export const solveSchema = (sdk: PlaySudoku): SudokuMessage|undefined => {
  let message: SudokuMessage|undefined = undefined;
  const solver = new Solver(sdk);
  const result = solver.solve();
  if (result.unique) {
    message = new SudokuMessage({
      message: 'Sudoku successfully solved!',
      type: MessageType.success
    });
    _extend(sdk, result.unique.sdk);
  } else if (result.multiple) {
    message = new SudokuMessage({
      message: 'Sudoku has multiple results!',
      type: MessageType.warning
    });
  } else {
    message = new SudokuMessage({
      message: 'Sudoku has no valid result!',
      type: MessageType.error
    });
  }
  return message;
}

/**
 * cancella i dati utente dello schema
 * @param sdk
 */
export const clearSchema = (sdk: PlaySudoku): boolean => {
  const cleared = clear(sdk);
  _extend(sdk, cleared);
  return true;
}

/**
 * risolve lo step successivo
 * @param sdk
 */
export const solveSchemaStep = (sdk: PlaySudoku): any => {


  return null;
}

/**
 * Attiva/disattiva la modalità matita
 * @param sdk
 */
export const togglePencil = (sdk: PlaySudoku): boolean => {
  sdk.options.usePencil = !sdk.options.usePencil;
  return true;
}

/**
 * Imposta il valore della cella
 * @param cell
 * @param value
 * @param options
 */
export const applyCellValue = (cell?: PlaySudokuCell, value?: string, options?: PlaySudokuOptions): boolean => {
  if (!cell || cell.fixed) return false;
  if (!isValidValue(value||'')) return false;
  if (value === 'Delete') value = '';
  if (!!options?.usePencil) {
    cell.value = '';
    cell.pencil = !value ? [] : toggleValue(cell.pencil, value);
  } else {
    cell.pencil = [];
    cell.value = (value || '').trim();
  }
  return true;
}

/**
 * imposta il valore sulla cella o sui valori possibili
 * @param sdk
 * @param cellId
 * @param value
 */
export const setCellValue = (sdk: PlaySudoku, cellId: string, value: string): boolean => {
  if (cellId) {
    const cell = sdk.cells[cellId];
    return applyCellValue(cell, value, sdk?.options);
  }
  return false;
}
