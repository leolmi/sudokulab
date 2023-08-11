import {
  checkAvailables,
  clear,
  MessageType,
  PlaySudoku,
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
 * imposta il valore sulla cella o sui valori possibili
 * @param sdk
 * @param cellId
 * @param value
 */
export const setCellValue = (sdk: PlaySudoku, cellId: string, value: string): boolean => {
  if (cellId) {
    const cell = sdk.cells[cellId];
    if (!cell || cell.fixed) return false;
    value = (value||'').trim();
    if (value === 'Delete') value = '';

    if (sdk.options.usePencil) {
      if (cell) {
        cell.value = '';
        if (!value) {
          cell.pencil = [];
        } else {
          cell.pencil = toggleValue(cell.pencil, value);
        }
        return true;
      }
    } else if (cell) {
      cell.pencil = [];
      cell.value = value;
      return true;
    }
  }
  return false;
}
