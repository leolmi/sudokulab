import {
  ApplySudokuRulesOptions,
  cellId, checkStatus,
  DIFFICULTY_MAX,
  EndGenerationMode,
  GeneratorOptions,
  getCell,
  getDiffValue,
  getStat,
  hasErrors,
  isEmptyCell,
  SDK_PREFIX,
  setDynamic,
  SudokuCell,
  SudokuEx,
  Symmetry,
  TRY_NUMBER_ALGORITHM
} from '@olmi/model';
import { cloneDeep as _clone, isArray as _isArray, isObject as _isObject, keys as _keys, random as _random } from 'lodash';
import { GeneratorContext } from './logic.model';
import { solve } from './logic.solver';
import { getSolution } from './logic.helper';

/**
 * vero se il numero di celle dinamiche e fisse è maggiore o uguale
 * al numero di valori richiesti (richiede che siano aggiornate le `ctx.session.currentStat`,
 * ossia le statistiche dello schema corrente)
 * @param ctx
 */
export const isSchemaComplete = (ctx: GeneratorContext) => {
  return ctx.session.currentStat.fixedAndDynamicCount >= (ctx.session?.options.fixedCount || 0);
}

export const isSchemaFilled = (ctx: GeneratorContext) => {
  return ctx.session.currentStat.dynamicEmptyCount <= 0;
}

/**
 * vero se lo schema corrente contiene errori
 * @param ctx
 */
export const schemaHasErrors = (ctx: GeneratorContext): boolean => {
  return hasErrors(ctx.session.currentSchema?.cells||[]);
}

/**
 * ricalcola le statistiche dopo l'esecuzione della logica
 * @param ctx
 * @param logic
 */
export const updateSchemaStat = (ctx: GeneratorContext, logic: () => void): void => {
  logic();
  ctx.session.currentStat = getStat(ctx.session.currentSchema?.cells||[]);
}

/**
 * ricalcola le statistiche dopo l'esecuzione della logica e l'aggiornamento
 * dei valori possibili secondo le regole del sudoku
 * @param ctx
 * @param logic
 */
export const updateSchemaAdvanced = (ctx: GeneratorContext, logic: () => void): void => {
  updateSchemaStat(ctx, () => {
    logic();
    applySudokuRulesOnSchema(ctx, { resetBefore: true });
  })
}

/**
 * genera un nuovo schema, aggiorna le statistiche e applica le regole del sudoku
 * @param ctx
 */
export const generateNewSchema = (ctx: GeneratorContext) => {
  updateSchemaAdvanced(ctx, () =>
    ctx.session.currentSchema = new SudokuEx({ cells: _clone(ctx.session.originalCells) }));
}

/**
 * vero se la sessione è completata, ossia se la modalità di conclusione è stata raggiunta
 * @param ctx
 */
export const isSessionComplete = (ctx: GeneratorContext): boolean => {
  if (ctx.session.stopped || !ctx.session.time) return true;
  switch (ctx.session.options.endMode) {
    case EndGenerationMode.afterN:
      return _keys(ctx.schemas).length >= ctx.session.options.maxSchemas;
    case EndGenerationMode.afterTime:
      return (Date.now() - ctx.session.time) >= (ctx.session.options.maxSeconds * 1000)
    case EndGenerationMode.manual:
    default:
      return false;
  }
}

/**
 * sceglie una cella vuota a caso
 * @param ctx
 */
const _getRandomEmptyCell = (ctx: GeneratorContext): SudokuCell => {
  const emptyCells = (ctx.session.currentSchema?.cells||[]).filter(c => isEmptyCell(c))
  const rnd_index = _random(0, emptyCells.length - 1);
  return emptyCells[rnd_index];
}

/**
 * Restituisce le celle simmetriche rispetto a quella passata
 * secondo le impostazioni utente
 * @param ctx
 * @param cell
 */
const _getSymmetricalCells = (ctx: GeneratorContext, cell: SudokuCell): SudokuCell[] => {
  if (!cell) return [];
  let other_ids: string[] = [];
  const last = ctx.session.currentStat.rank - 1;
  switch (ctx.session.options.symmetry) {
    case Symmetry.central:  //+1
      other_ids = [cellId(last - cell.col, last - cell.row)];
      break;
    case Symmetry.diagonalNWSE:  //+1
      other_ids = [cellId(cell.row, cell.col)];
      break;
    case Symmetry.diagonalNESW:  //+1
      other_ids = [cellId(last - cell.row, last - cell.col)];
      break;
    case Symmetry.doubleDiagonal:  //+3
      other_ids = [
        cellId(last - cell.col, last - cell.row),
        cellId(cell.row, cell.col),
        cellId(last - cell.row, last - cell.col)]
      break;
    case Symmetry.horizontal:  //+1
      other_ids = [cellId(last - cell.col, cell.row)];
      break;
    case Symmetry.vertical:  //+1
      other_ids = [cellId(cell.col, last - cell.row)];
      break;
    case Symmetry.doubleMedian:  //+3
      other_ids = [
        cellId(last - cell.col, last - cell.row),
        cellId(last - cell.col, cell.row),
        cellId(cell.col, last - cell.row)]
      break;
    case Symmetry.none:  //+0
    default:
      break;
  }
  return <SudokuCell[]>other_ids
    .map(id => getCell(ctx.session.currentSchema?.cells||[], id))
    .filter(c => !!c && c.id !== cell.id);
}

export const addDynamicCell = (ctx: GeneratorContext): boolean => {
  let applied = false;
  const ec = _getRandomEmptyCell(ctx);
  if (ec) {
    // la trasforma in cella dinamica
    updateSchemaStat(ctx, () => setDynamic(ec));
    applied = true;
    // aggiunge le altre celle dinamiche secondo le opzioni di simmetria e numerosità passate
    _getSymmetricalCells(ctx, ec)
      .forEach(oc => {
        if (!isSchemaComplete(ctx) && isEmptyCell(oc)) {
          updateSchemaStat(ctx, () => setDynamic(oc));
        }
      });
  }
  return applied;
}


/**
 * crea un elenco casuale delle celle da valorizzare
 * @param cells
 */
export const shuffleCells = (cells: SudokuCell[]): SudokuCell[] => {
  const length = cells.length;
  const source = [...cells];
  return [...Array(length)].map(() => {
    const index = _random(source.length-1);
    return source.splice(index, 1)[0];
  });
}

/**
 * applica le regole del sudoku allo schema corrente
 * @param source
 * @param o
 */
export const applySudokuRulesOnSchema = (source: SudokuCell[]|GeneratorContext, o?: ApplySudokuRulesOptions): void => {
  const cells = _isArray(source) ?
    <SudokuCell[]>source :
    (<GeneratorContext>source).session.currentSchema?.cells||[];
  checkStatus(cells, o);
}

const _resetDynamicCell = (c: SudokuCell): void => {
  if (!c.isDynamic) return;
  c.isFixed = false;
  c.text = '';
}

/**
 * cancella il valore delle celle dinamiche e aggiorna i valori possibili
 * per le celle
 * @param source
 */
export const clearDynamics = (source: SudokuCell[]|GeneratorContext): void => {
  if (_isArray(source)) {
    source.forEach(c => _resetDynamicCell(c));
  } else if (_isObject(source)) {
    clearDynamics((<GeneratorContext>source).session.currentSchema?.cells || []);
  }
}

const checkTryAlg = (sdk: SudokuEx, o: GeneratorOptions): boolean => {
  return o.allowTryAlgorithm || (sdk.info.difficultyMap[TRY_NUMBER_ALGORITHM] || []).length < 1;
}

/**
 * vero se rispetta il filtro degli algoritmi
 * @param sdk
 * @param o
 */
const checkAlgList = (sdk: SudokuEx, o: GeneratorOptions): boolean => {
  const ualgs = (o.useAlgorithms || []).filter(ua => ua !== TRY_NUMBER_ALGORITHM || o.allowTryAlgorithm);
  if (ualgs.length <= 0) return true;
  const npa = ualgs.find(ua => (sdk.info.difficultyMap[ua] || []).length < 1);
  if (npa) {
    console.log(...SDK_PREFIX, `algorithm "${npa}" not used, so the scheme will be discarded.`, sdk);
  }
  return !npa;
}

/**
 * vero se la soluzione è valida
 * @param ctx
 * @param sdk
 */
export const isRightSolution = (ctx: GeneratorContext, sdk: SudokuEx|undefined): boolean => {
  // la soluzione deve esistere
  return !!sdk &&
    // se è definito un minimo di difficoltà quella rilevata deve essere maggiore o uguale
    (!ctx.session.options.difficultyLimitMin ||
      getDiffValue(sdk.info.difficulty, DIFFICULTY_MAX) >= getDiffValue(ctx.session.options.difficultyLimitMin)) &&
    // se è definito un massimo di difficoltà quella rilevata deve essere minore o uguale
    (!ctx.session.options.difficultyLimitMax ||
      getDiffValue(sdk.info.difficulty) <= getDiffValue(ctx.session.options.difficultyLimitMax, DIFFICULTY_MAX)) &&
    // verifica che sia abilitata l'opzione use-try oppure che la soluzione non utilizzi tale algoritmo
    checkTryAlg(sdk, ctx.session.options) &&
    // verifica l'utilizzo di tutti gli algoritmi selezionati
    checkAlgList(sdk, ctx.session.options);
}

/**
 * calcola la soluzione dello schema
 * @param ctx
 * @param handler
 */
export const calcSolution = (ctx: GeneratorContext, handler: (sdk: SudokuEx) => any): void => {
  const work = solve(ctx.session.currentSchema, {
    ...ctx.session.options,
    mode: 'all',
  });
  const sol = getSolution(work);
  if (isRightSolution(ctx, sol)) handler(sol!);
}
