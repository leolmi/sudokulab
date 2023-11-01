import {
  AlgorithmResultLine,
  Algorithms,
  applyCellValue,
  BoardWorkerData,
  BoardWorkerHighlights,
  cellId,
  checkAvailables,
  decodeCellId,
  MessageType,
  PlaySudoku,
  resetAvailable,
  Solver,
  SolveStepResult,
  solveStepToCell,
  SUDOKU_DEFAULT_RANK,
  SudokuMessage
} from "@sudokulab/model";
import {extend as _extend, isEmpty as _isEmpty, last as _last} from "lodash";

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
 * risolve lo step successivo
 * @param sdk
 */
export const solveSchemaStep = (sdk: PlaySudoku): BoardWorkerHighlights => {
  const infos = solveStepToCell(sdk, [Algorithms.tryNumber]);
  const last = _last(infos);
  const hl = BoardWorkerHighlights.empty;
  (last?.result?.cells || []).forEach(c => hl.cellValue[c] = true);
  _extend(sdk, last?.sdk || {});
  return hl;
}

export interface InfoStepResult {
  highlights: BoardWorkerHighlights;
  infos: SolveStepResult[];
}

/**
 * calcola le info per lo step successivo
 * @param sdk
 */
export const calcInfoStep = (sdk: PlaySudoku): BoardWorkerData => {
  const infos = solveStepToCell(sdk, [Algorithms.tryNumber]);
  const last = _last(infos);
  const rank = last?.sdk.sudoku?.rank || SUDOKU_DEFAULT_RANK;
  const highlights = BoardWorkerHighlights.empty;
  (last?.result?.cells || []).forEach(c => {
    const ci = decodeCellId(c, rank);
    highlights.cell[c] = true;
    for (let i = 0; i < rank; i++) {
      highlights.others[cellId(i, ci.row)] = true;
      highlights.others[cellId(ci.col, i)] = true;
    }
  });
  console.log('HIGLIGHTS', highlights);
  return {infos, highlights};
}

/**
 * restituisce gli highlights per le info
 * @param line
 */
export const getLineHighlights = (line?: AlgorithmResultLine): BoardWorkerHighlights => {
  const hl = BoardWorkerHighlights.empty;
  if (line?.cell) hl.cell[line.cell] = true;
  (line?.others||[]).forEach(o => hl.others[o] = true);
  return hl;
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
 * Attiva/disattiva la visibilità dei valori possibili
 * @param sdk
 */
export const toggleAvalable = (sdk: PlaySudoku): boolean => {
  sdk.options.showAvailables = !sdk.options.showAvailables;
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

/**
 * vero se la classe non porta informazioni
 * @param hl
 */
export const isEmptyHihlights = (hl: BoardWorkerHighlights): boolean => {
  return _isEmpty(hl?.cell) && _isEmpty(hl?.cellValue) && _isEmpty(hl?.others);
}
