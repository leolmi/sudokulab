import {
  applySudokuRules,
  cellId,
  decodeCellId,
  EditSudoku,
  EditSudokuCell,
  EditSudokuEndGenerationMode,
  EditSudokuGenerationMap,
  EditSudokuOptions,
  EditSudokuValorizationMode,
  GenerationMapCellInfo,
  Generator,
  getAvailables,
  getMinNumbers,
  getValues,
  isValue,
  MessageType,
  PlaySudoku,
  PlaySudokuOptions,
  SDK_PREFIX,
  SolveAllResult,
  Solver,
  Sudoku,
  SUDOKU_DYNAMIC_VALUE,
  SUDOKU_EMPTY_VALUE,
  SudokuMessage,
  SudokuSymmetry,
  traverseSchema
} from '@sudokulab/model';
import {
  extend as _extend,
  findLastIndex as _findLastIndex,
  forEach as _forEach,
  keys as _keys,
  random as _random,
  reduce as _reduce,
  remove as _remove
} from 'lodash';
import { combineLatest } from 'rxjs';
import { use } from '../../global.helper';


const _getSymmetryCells = (id: string|undefined, sdk: EditSudoku): EditSudokuCell[] => {
  if (!id) return [];
  const info = decodeCellId(id);
  let other_ids: string[] = [];
  const last = sdk.options.rank - 1;
  switch (sdk.options.symmetry) {
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
  _remove(other_ids, cid => cid === id);
  return <EditSudokuCell[]>(other_ids.map(oid => sdk.cells[oid]).filter(c => !!c));
}

/**
 * restituisce una cella a caso tra quelle vuote
 * @param sdk
 */
const _randomEmptyCell = (sdk: EditSudoku): EditSudokuCell|undefined => {
  const emptyCells = _keys(sdk.cells)
    .filter(k => !sdk.cells[k]?.value);

  const rnd_pos = _random(0, emptyCells.length - 1);

  return sdk.cells[emptyCells[rnd_pos]];
}

/**
 * lo schema è processabile se il numero minimo di celle fisse è garantito e
 * se esiste almeno un valore fisso dinamico
 * @param sdk
 */
export const solvable = (sdk: EditSudoku): boolean => {
  return (sdk.options.fixedCount >= getMinNumbers(sdk.options?.rank) &&
    (sdk.fixedCount < sdk.options.fixedCount || !!(sdk.cellList||[]).find(fc => fc.fixed && fc.value === SUDOKU_DYNAMIC_VALUE)));
  // return (sdk.cellList || []).filter(c => c.fixed).length > getMinNumbers(sdk.options?.rank) &&
  //   !!(sdk.cellList || []).find(c => c.value === SUDOKU_DYNAMIC_VALUE);
}

/**
 * Aggiunge le celle fisse (dinamiche ossia valorizzate con "x") allo schema
 * rispettando la simmetria specificata
 *
 * @param sdk
 */
const _addFixed = (sdk: EditSudoku): boolean => {
  // numero di celle fisse mancanti rispetto al numero obiettivo
  // definito dall'utente
  const availablesCount = sdk.options.fixedCount - sdk.fixedCount;
  if (availablesCount <= 0) return false;
  // prima cella disponibile casuale tra quelle non fisse
  const first_cell = _randomEmptyCell(sdk);
  let cells: EditSudokuCell[] = first_cell ? [first_cell] : [];
  // aggiunge quelle necessarie secondo la simmetria scelta
  cells = cells.concat(_getSymmetryCells(first_cell?.id, sdk));
  // prende solo quelle che è possibile inserire senza superare
  // il numero di celle fisse obiettivo definito dall'utente
  const toaddcount = Math.min(cells.length, availablesCount);
  for(let i=0; i<toaddcount; i++) {
    const cell = cells[i];
    if (!cell.value) cell.value = SUDOKU_DYNAMIC_VALUE;
    sdk.checkFixedCell(cell);
  }
  if (sdk.fixed.length !== sdk.fixedCount) console.warn('Fixed count not coerent!', sdk);
  return true;
}

/**
 * rileva, al termine di ogni ciclo lo stato di fine procedura
 * @param G
 * @param handler
 */
export const isOnEnd = (G: Generator, handler: (ended: boolean) => any) =>
  use(combineLatest(G.facade.selectGeneratorIsStopping$, G.facade.selectGeneratorIsRunning$), ([stopping, running]) => {
    const stopped = stopping || !running;
    if (stopped) return handler(true);
    if (!solvable(G.sdk)) {
      G.facade.raiseMessage(new SudokuMessage({
        message: 'Not solvable schema!',
        type: MessageType.warning
      }));
      return handler(true);
    }
    switch (G.sdk.options.generationEndMode) {
      case EditSudokuEndGenerationMode.afterN:
        return handler(stopped || _keys(G.schemas).length >= (G.sdk.options.generationEndValue || 1));
      case EditSudokuEndGenerationMode.afterTime:
        const elapsed = performance.now() - G.generating;
        return handler(stopped || elapsed >= ((G.sdk.options.generationEndValue || 60) * 1000));
      case EditSudokuEndGenerationMode.manual:
      default:
        return handler(stopped);
    }
  });


export const loadSchema = (sdk: EditSudoku, sch: string) => {
  const rank2 = (sch || '').length;
  const rank = Math.sqrt(rank2);
  if ([4, 9, 16].indexOf(rank) < 0) return console.warn('Cannot load schema!', sch);
  const esdk = new EditSudoku({
    originalSchema: sch,
    options: new EditSudokuOptions({ ...sdk.options, rank })
  });
  esdk.cellList.forEach((cell, index) => {
    const v = sch.charAt(index) || '';
    cell.value = isValue(v, true) ? v : '';
    esdk.checkFixedCell(cell);
  });
  _checkOriginalSchema(esdk);
  _extend(sdk, esdk);
  delete sdk.generationMap;
}

export const loadOriginalSchema = (sdk: EditSudoku) => loadSchema(sdk, sdk.originalSchema || '');

const _checkSchema = (sdk: EditSudoku) => {
  sdk.fixed = _reduce(sdk.cells, (cll, c) => c?.fixed ? cll.concat(c) : cll, <EditSudokuCell[]>[]);
}

/**
 * Persiste lo schema originale
 * @param sdk
 */
const _checkOriginalSchema = (sdk: EditSudoku) => {
  if (!sdk.originalSchema)
    sdk.originalSchema = sdk.cellList.map(c => c.value||SUDOKU_EMPTY_VALUE).join('');
}

/**
 * Genera la mappa per la generazione se non è presente
 * @param sdk
 */
const _checkGenerationMap = (sdk: EditSudoku, force = false) => {
  if (!sdk.generationMap || force) sdk.generationMap = new EditSudokuGenerationMap(sdk);
}

const _checkAvailables = (sdk: EditSudoku) => {
  _forEach(sdk.cells || {}, (c) => {
    if (!!c) {
      // viene popolata la collezione dei valori possibili se la cella non è
      // una di quelle realmente fisse
      c.availables = (c.fixed && !(sdk.generationMap?.cellsX||{})[c.id]) ? [] : getAvailables(sdk.options?.rank);
    }
  });
}

export const resetSchemaMap = (sdk: EditSudoku) => {
  _checkGenerationMap(sdk, true);
}

/**
 * Inizializza lo schema
 * @param sdk
 */
export const initSchema = (sdk: EditSudoku) => {
  _checkSchema(sdk);
  _checkOriginalSchema(sdk);
  _checkGenerationMap(sdk);
}

export const checkSchema = (sdk: EditSudoku) => {
  _checkAvailables(sdk);
}

/**
 * Resetta i valori dinamici dello schema
 * @param sdk
 */
export const resetSchema = (sdk: EditSudoku, alsoIndex = false) => {
  loadOriginalSchema(sdk);
}

/**
 * aggiunge nuovi fixed se il numero di quelli inseriti è minore dell numero previsto
 *  - rispetta la simmetria se specificata
 * @private
 */
export const checkNumbers = (sdk: EditSudoku): boolean => {
  let added = false;
  while (sdk.fixedCount < sdk.options.fixedCount) {
    if (_addFixed(sdk)) added = true;
  }
  return added;
}

/**
 * Resetta lo stato delle x-celle con indice maggiore uguale a quello passato
 * @param sdk
 * @param startIndex
 */
const resetCellsX = (sdk: EditSudoku, startIndex = 0) => {
  const xcells = (sdk.generationMap?.fixedCellsX || []);
  xcells.forEach((c, index) => {
    if (c.isValueX && index >= startIndex) {
      const cell = sdk.cells[c.id];
      if (cell) {
        cell.value = SUDOKU_DYNAMIC_VALUE;
        c.index = -1;
      }
    }
  });
  applySudokuRules(sdk);
}

const hasNoValorizations = (sdk: EditSudoku): boolean => {
  switch (sdk.options.valorizationMode) {
    case EditSudokuValorizationMode.random:
      const valorization = getValues(sdk);
      return !!sdk.valorizations[valorization];
    case EditSudokuValorizationMode.sequential:
    default:
      return !(sdk.generationMap?.fixedCellsX || []).find(c => c.index < ((sdk.cells[c.id]?.availables||[]).length - 1))
  }
}

const isFirstValorization = (xcells: GenerationMapCellInfo[]): boolean => {
  return !xcells.find(c => c.index >= 0);
}

const findLastIncrementableIndex = (sdk: EditSudoku): number => {
  const xcells = (sdk.generationMap?.fixedCellsX || []);
  const index = _findLastIndex(xcells, c => c.index < (sdk.cells[c.id]?.availables||[]).length - 1);
  if (index > -1) resetCellsX(sdk, index + 1);
  return index;
}

const upgradeXCell = (sdk: EditSudoku, xcell: GenerationMapCellInfo) => {
  const cell = sdk.cells[xcell.id];
  switch (sdk.options.valorizationMode) {
    case EditSudokuValorizationMode.sequential:
      xcell.index++;
      break;
    case EditSudokuValorizationMode.random:
      xcell.index = _random(0, (cell?.availables || []).length - 1);
      break;
  }
  if (!!cell) cell.value = cell.availables[xcell.index];
  applySudokuRules(sdk, true);
}

/**
 * valorizzazione sequenziale dei fixed dinamici (valorizzati con "x")
 * @param sdk
 */
export const checkValues = (sdk: EditSudoku): boolean => {
  // se non contiene celle fisse dinamiche esce
  let values: string = '';
  const xcells = (sdk.generationMap?.fixedCellsX || []);
  const xcells_count = xcells.length;
  if (xcells_count <= 0) return true;

  // la prima valorizzazione inserisce per ogni cella il primo valore disponibile
  if (isFirstValorization(xcells)) {
    xcells.forEach(xc => upgradeXCell(sdk, xc));
  } else if (hasNoValorizations(sdk)) {
    return false;
  } else {
    values = getValues(sdk);
    sdk.valorizations[values] = true;
    switch (sdk.options.valorizationMode) {
      case EditSudokuValorizationMode.sequential:
        const index = findLastIncrementableIndex(sdk);
        if (index < 0) return false;
        for (let i = index; i < xcells_count; i++) {
          upgradeXCell(sdk, xcells[i])
        }
        break;
      case EditSudokuValorizationMode.random:
        xcells.forEach(xc => upgradeXCell(sdk, xc));
        break;
    }
  }

  values = getValues(sdk);
  let invalidValues = !!xcells.find(c => !isValue(sdk.cells[c.id]?.value || ''));
  if (invalidValues) console.warn(...SDK_PREFIX, 'Invalid values', values);
  const errorcell = sdk.cellList.find(c => !c.fixed && c.availables.length <= 0);
  if (!!errorcell) invalidValues = true;
  return !invalidValues;
}

const getFixedValues = (sdk: EditSudoku): string => {
  let fixed = '';
  traverseSchema(sdk, (cid) => {
    const raw_value = sdk.cells[cid]?.value || '';
    const value = isValue(raw_value) ? raw_value : SUDOKU_EMPTY_VALUE;
    fixed = `${fixed || ''}${value}`;
  });
  return fixed;
}

export const getSudoku = (sdk: EditSudoku): Sudoku => {
  return new Sudoku({
    rank: sdk.options.rank,
    fixed: getFixedValues(sdk)
  });
}

/**
 * risolve lo schema > se unica salva schema altrimenti skippa
 * @param sdk
 */
export const solveSchema = (sdk: EditSudoku): SolveAllResult => {
  const sudoku = getSudoku(sdk);
  const options = new PlaySudokuOptions({
    maxSplitSchema: sdk.options.maxSplitSchema || 500,
    excludeTryAlgorithm: sdk.options.excludeTryAlgorithm
  });
  const solver = new Solver(new PlaySudoku({ sudoku, options }));
  return solver.solve();
}



