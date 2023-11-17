import {
  cellId,
  decodeCellId,
  GeneratorStatus,
  getGeneratorStatus,
  getPlayFixedValues,
  PlaySudoku,
  PlaySudokuCell,
  SUDOKU_DEFAULT_MAX_SCHEMA_COUNT,
  SUDOKU_DEFAULT_RANK, SUDOKU_STANDARD_CHARACTERS,
  SudokuSymmetry
} from "@sudokulab/model";
import {cloneDeep as _clone, keys as _keys, random as _random, remove as _remove} from 'lodash';

export interface SchemaGenerationResult {
  sdk?: PlaySudoku;
}

export interface SchemaGenerationOptions {
  cache?: any;
  maxCyclesCount?: number;
  check?: () => boolean;
}

/**
 * restituisce una cella a caso tra quelle vuote
 */
const _getRandomEmptyCell = (sdk: PlaySudoku): PlaySudokuCell|undefined => {
  const cells = sdk?.cells || {};
  const emptyCells = _keys(cells).filter(k => !cells[k]?.value);
  const rnd_pos = _random(0, emptyCells.length - 1);
  return cells[emptyCells[rnd_pos]];
}

/**
 * Restituisce le celle simmetriche rispetto a quella passata
 * secondo le impostazioni utente
 * @param sdk
 * @param cid
 */
const _getSymmetricalCells = (sdk: PlaySudoku, cid: string): PlaySudokuCell[] => {
  if (!cid) return [];
  const cells = sdk?.cells||{};
  const info = decodeCellId(cid);
  let other_ids: string[] = [];
  const rank = sdk.sudoku?.rank || SUDOKU_DEFAULT_RANK;
  const last = rank - 1;
  switch (sdk.options.generator.symmetry) {
    case SudokuSymmetry.central:  //+1
      other_ids = [cellId(last - info.col, last - info.row)];
      break;
    case SudokuSymmetry.diagonalNWSE:  //+1
      other_ids = [cellId(info.row, info.col)];
      break;
    case SudokuSymmetry.diagonalNESW:  //+1
      other_ids = [cellId(last - info.row, last - info.col)];
      break;
    case SudokuSymmetry.doubleDiagonal:  //+3
      other_ids = [
        cellId(last - info.col, last - info.row),
        cellId(info.row, info.col),
        cellId(last - info.row, last - info.col)]
      break;
    case SudokuSymmetry.horizontal:  //+1
      other_ids = [cellId(last - info.col, info.row)];
      break;
    case SudokuSymmetry.vertical:  //+1
      other_ids = [cellId(info.col, last - info.row)];
      break;
    case SudokuSymmetry.doubleMedian:  //+3
      other_ids = [
        cellId(last - info.col, last - info.row),
        cellId(last - info.col, info.row),
        cellId(info.col, last - info.row)]
      break;
    case SudokuSymmetry.none:  //+0
    default:
      break;
  }
  _remove(other_ids, oid => oid === cid);
  return <PlaySudokuCell[]>(other_ids.map(oid => cells[oid]).filter(c => !!c));
}


/**
 * aggiunge una (o più celle dinamiche) secondo quante ne mancano
 * e secondo le logiche di generazione
 * @param sdk
 */
const _addDynamicCell = (sdk: PlaySudoku): GeneratorStatus => {
  let status = getGeneratorStatus(sdk);
  let stop = false;
  while (status.generated > 0 && !stop) {
    // parte scegliendo una cella a caso tra quelle non valorizzate
    const cell1 = _getRandomEmptyCell(sdk);
    if (cell1) {
      let cells: PlaySudokuCell[] = [cell1];
      // se si richiedono più di una cella per raggiungere il fixedCount dello
      // schema allora ne aggiunge N secondo le opzioni di simmetria scelte
      if (status.generated > 1) cells = cells.concat(_getSymmetricalCells(sdk, cell1?.id));
      // imposta le celle dinamiche
      cells.forEach((c, i) => {
        if (i < status.generated) {
          c.value = SUDOKU_STANDARD_CHARACTERS.dynamic;
          c.fixed = true;
        }
      })
    }
    const status_new = getGeneratorStatus(sdk);
    // se la quantità di numeri da aggiungere rimane invariata esce
    if (status.generated === status_new.generated) stop = true;
    status = status_new;
  }
  return status;
}

/**
 * riempie lo schema secondo le opzioni utente
 * @param sdk
 */
const _fillSchema = (sdk?: PlaySudoku) => {
  if (!sdk) return;
  let status: GeneratorStatus | undefined = undefined;
  let pre_generated: number;
  do {
    pre_generated = status?.generated || 0;
    status = _addDynamicCell(sdk);
    // se il numero dei generated è maggiore di zero e rimane costante, esce
  } while (status.generated > 0 && pre_generated !== status.generated);
}

/**
 * Aggiunge le celle dinamiche secondo le opzioni di simmetria fino a raggiungere
 * il numero di valori richiesti (fixedCount)
 * @param sdk
 * @param options
 */
export const generateSchema = (sdk?: PlaySudoku, options?: SchemaGenerationOptions): SchemaGenerationResult => {
  const res: SchemaGenerationResult = {};
  if (sdk) {
    let cycle = 0;
    do {
      const gsdk = _clone(sdk);
      cycle++;
      _fillSchema(gsdk);
      const key = getPlayFixedValues(gsdk);
      if (!(options?.cache || {})[key]) {
        // aggiunge lo schema in cache
        (options?.cache || {})[key] = true;
        res.sdk = gsdk;
      }
      // il ciclo continua fino a che non viene creato uno schema che non è in cache
      // e non sono eseguiti più cicli di quelli definiti nelle opzioni
    } while ((!options?.check || options.check()) &&
            !res.sdk &&
            cycle < (options?.maxCyclesCount || SUDOKU_DEFAULT_MAX_SCHEMA_COUNT));
  }
  return res;
}
