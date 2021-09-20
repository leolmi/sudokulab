import {
  applySudokuRules,
  cellId,
  decodeCellId,
  EditSudoku,
  EditSudokuCell,
  EditSudokuEndGenerationMode,
  EditSudokuGenerationMap,
  EditSudokuOptions,
  GenerationMapCellInfo,
  Generator,
  getAvailables, getMinNumbers,
  isValue,
  PlaySudoku,
  SolveAllResult,
  Solver,
  Sudoku,
  SUDOKU_DYNAMIC_VALUE,
  SudokuSymmetry,
  traverseSchema,
  use
} from '@sudokulab/model';
import {
  extend as _extend,
  findLastIndex as _findLastIndex,
  forEach as _forEach,
  keys as _keys,
  random as _random,
  reduce as _reduce
} from 'lodash';
import { combineLatest } from 'rxjs';


const _getSymmetryCells = (id: string|undefined, sdk: EditSudoku): EditSudokuCell[] => {
  if (!id) return [];
  const info = decodeCellId(id);
  let other_ids: string[] = [];
  switch (sdk.options.simmetry) {
    case SudokuSymmetry.central:  //+1
      other_ids = [cellId(sdk.options.rank - info.col, sdk.options.rank - info.row)];
      break;
    case SudokuSymmetry.diagonalNWSE:  //+1
      other_ids = [cellId(info.row, info.col)];
      break;
    case SudokuSymmetry.diagonalNESW:  //+1
      other_ids = [cellId(sdk.options.rank - info.row, sdk.options.rank - info.col)];
      break;
    case SudokuSymmetry.doubleDiagonal:  //+3
      other_ids = [
        cellId(sdk.options.rank - info.col, sdk.options.rank - info.row),
        cellId(info.row, info.col),
        cellId(sdk.options.rank - info.row, sdk.options.rank - info.col)]
      break;
    case SudokuSymmetry.horizontal:  //+1
      other_ids = [cellId(sdk.options.rank - info.col, info.row)];
      break;
    case SudokuSymmetry.vertical:  //+1
      other_ids = [cellId(info.col, sdk.options.rank - info.row)];
      break;
    case SudokuSymmetry.doubleMedian:  //+3
      other_ids = [
        cellId(sdk.options.rank - info.col, sdk.options.rank - info.row),
        cellId(sdk.options.rank - info.col, info.row),
        cellId(info.col, sdk.options.rank - info.row)]
      break;
    case SudokuSymmetry.none:  //+0
    default:
      break;
  }
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

export const solvable = (sdk: EditSudoku): boolean => {
  return (sdk.generationMap?.fixedCells || []).length > getMinNumbers(sdk.options?.rank) &&
    (sdk.generationMap?.fixedCellsX || []).length > 0;
}

/**
 * Aggiunge le celle fisse (dinamiche ossia valorizzate con "x") allo schema
 * rispettando la simmetria specificata
 *
 * @param sdk
 */
const _addFixed = (sdk: EditSudoku) => {
  // numero di celle fisse mancanti rispetto al numero obiettivo
  // definito dall'utente
  const availablesCount = sdk.options.fixedCount - sdk.fixedCount;
  if (availablesCount <= 0) return;
  // prima cella disponibile casuale tra quelle non fisse
  const first_cell = _randomEmptyCell(sdk);
  let cells: EditSudokuCell[] = first_cell ? [first_cell] : [];
  // aggiunge quelle necessarie secondo la simmetria scelta
  cells = cells.concat(_getSymmetryCells(first_cell?.id, sdk));
  // prende solo quelle che è possibile inserire senza superare
  // il numero di celle fisse obiettivo definito dall'utente
  const toaddcount = Math.min(cells.length, availablesCount);
  for(let i=0; i<toaddcount; i++) {
    if (!cells[i].value) cells[i].value = SUDOKU_DYNAMIC_VALUE;
    sdk.checkFixedCell(cells[i]);
  }
  if (sdk.fixed.length !== sdk.fixedCount) console.warn('Fixed count not coerent!', sdk);
}

/**
 * rileva, al termine di ogni ciclo lo stato di fine procedura
 * @param G
 * @param handler
 */
export const isOnEnd = (G: Generator, handler: (ended: boolean) => any) =>
  use(combineLatest(G.facade.selectGeneratorIsStopping$, G.schemas$), ([stopping, schemas]) => {
    if (!solvable(G.sdk)) return handler(true);
    switch (G.sdk.options.generationEndMode) {
      case EditSudokuEndGenerationMode.afterN:
        return handler(stopping || schemas.length >= (G.sdk.options.generationEndValue || 1));
      case EditSudokuEndGenerationMode.afterTime:
        const elapsed = performance.now() - G.generating;
        return handler(stopping || elapsed >= ((G.sdk.options.generationEndValue || 60) * 1000));
      case EditSudokuEndGenerationMode.manual:
      default:
        return handler(stopping);
    }
  });


export const loadSchema = (sdk: EditSudoku, sch: string) => {
  const rank2 = (sch||'').length;
  const rank = Math.sqrt(rank2);
  if ([4,9,16].indexOf(rank)<0) return console.warn('Cannot load schema!', sch);
  const esdk = new EditSudoku({
    originalSchema: sch,
    options: new EditSudokuOptions({ ...sdk.options, rank })
  });
  esdk.cellList.forEach((cell, index) => {
    cell.value = sch.charAt(index);
    esdk.checkFixedCell(cell);
  });
  _checkOriginalSchema(esdk);
  _extend(sdk, esdk);
  delete sdk.generationMap;
}

const _reloadOriginalSchema = (sdk: EditSudoku) => loadSchema(sdk, sdk.originalSchema || '');

const _checkSchema = (sdk: EditSudoku) => {
  sdk.fixed = _reduce(sdk.cells, (cll, c) => c?.fixed ? cll.concat(c) : cll, <EditSudokuCell[]>[]);
}

/**
 * Persiste lo schema originale
 * @param sdk
 */
const _checkOriginalSchema = (sdk: EditSudoku) => {
  if (!sdk.originalSchema)
    sdk.originalSchema = sdk.cellList.map(c => c.value||'0').join('');
}

/**
 * Genera la mappa per la generazione se non è presente
 * @param sdk
 */
const _checkGenerationMap = (sdk: EditSudoku) => {
  if (!sdk.generationMap) sdk.generationMap = new EditSudokuGenerationMap(sdk);
}

const _checkAvailables = (sdk: EditSudoku) => {
  _forEach(sdk.cells || {}, (c) => {
    if (!!c) {
      c.availables = (c.fixed && c.value !== SUDOKU_DYNAMIC_VALUE) ? [] : getAvailables(sdk.options?.rank);
    }
  });
}

/**
 * Inizializza lo schema
 * @param sdk
 */
export const initSchema = (sdk: EditSudoku) => {
  _checkSchema(sdk);
  _checkOriginalSchema(sdk);
  _checkGenerationMap(sdk);
  _checkAvailables(sdk);
}

/**
 * Resetta i valori dinamici dello schema
 * @param sdk
 */
export const resetSchema = (sdk: EditSudoku) => {
  (sdk.generationMap?.fixedCellsX||[]).forEach(c => {
    const cell = sdk.cells[c.id];
    if (!!cell) cell.value = SUDOKU_DYNAMIC_VALUE;
  })
}

/**
 * aggiunge nuovi fixed se il numero di quelli inseriti è minore dell numero previsto
 *  - rispetta la simmetria se specificata
 * @private
 */
export const checkNumbers = (sdk: EditSudoku) => {
  while (sdk.fixedCount < sdk.options.fixedCount) {
    _addFixed(sdk);
  }
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
  return !(sdk.generationMap?.fixedCellsX || []).find(c => c.index < ((sdk.cells[c.id]?.availables||[]).length - 1))
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
  xcell.index++;
  if (!!cell) cell.value = cell.availables[xcell.index];
  applySudokuRules(sdk);
}

/**
 * valorizzazione sequenziale dei fixed dinamici (valorizzati con "x")
 * @param sdk
 */
export const checkValues = (sdk: EditSudoku): boolean => {
  // se non contiene celle fisse dinamiche esce
  const xcells = (sdk.generationMap?.fixedCellsX || []);
  const xcells_count = xcells.length;
  if (xcells_count <= 0) return true;
  // ricerca la cella da incrementare
  //  - verifia che tutte le celle fixed siano valorizzate
  applySudokuRules(sdk);

  // la prima valorizzazione inserisce per ogni cella il primo valore disponibile
  if (isFirstValorization(xcells)) {
    xcells.forEach(xc => upgradeXCell(sdk, xc));
    return true;
  } else if (hasNoValorizations(sdk)) {
    return false;
  }

  const index = findLastIncrementableIndex(sdk);
  if (index < 0) return false;
  for (let i = 0; i < xcells_count; i++) {
    upgradeXCell(sdk, xcells[i])
  }

  return true;
}

const getFixedValues = (sdk: EditSudoku): string => {
  let fixed = '';
  traverseSchema(sdk, (cid) => {
    const raw_value = sdk.cells[cid]?.value || '';
    const value = isValue(raw_value) ? raw_value : '0';
    fixed = `${fixed || ''}${value}`;
  });
  return fixed;
}

/**
 * risolve lo schema > se unica salva schema altrimenti skippa
 * @param sdk
 */
export const solveSchema = (sdk: EditSudoku): SolveAllResult => {
  const sudoku = new Sudoku({ rank: sdk.options.rank, fixed: getFixedValues(sdk) });
  const solver = new Solver(new PlaySudoku({ sudoku }));
  return solver.solve();
}
