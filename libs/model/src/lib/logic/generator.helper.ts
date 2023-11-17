import {
  cloneDeep as _clone,
  findLastIndex as _findLastIndex,
  keys as _keys,
  random as _random,
  reduce as _reduce,
  remove as _remove
} from "lodash";
import {Dictionary} from "@ngrx/entity";
import {EditSudoku, EditSudokuGenerationMap, GenerationMapCellInfo} from "../EditSudoku";
import {SUDOKU_STANDARD_CHARACTERS} from "../consts";
import {EditSudokuCell} from "../EditSudokuCell";
import {
  applySudokuRules,
  cellId,
  decodeCellId,
  getAvailables,
  getRank,
  getSolutionSudoku,
  getValues,
  traverseSchema
} from "../../sudoku.helper";
import {SudokuEndGenerationMode, SudokuValorizationMode, SudokuSymmetry} from "../enums";
import {SolveAllResult} from "./SolveAllResult";
import {PlaySudokuOptions} from "../PlaySudokuOptions";
import {Solver} from "./solver.logic";
import {PlaySudoku} from "../PlaySudoku";
import {isDynamic, isValue} from "../../global.helper";
import {Sudoku} from "../Sudoku";

/**
 * verifica la consistenza dello schema
 * @param sdk
 */
const _checkSchema = (sdk: EditSudoku) => {
  sdk.fixed = _reduce(sdk.cells, (cll, c) => c?.fixed ? cll.concat(c?.id||'') : cll, <string[]>[]);
  if (!sdk.originalSchema)
    sdk.originalSchema = sdk.cellList.map(cid => sdk.cells[cid]).map(c => c?.value||SUDOKU_STANDARD_CHARACTERS.empty).join('');
}

/**
 * Inizializza lo schema
 * @param sdk
 */
export const initSchema = (sdk: EditSudoku): EditSudoku => {
  const csdk = _clone(sdk);
  _checkSchema(csdk);
  return csdk;
}

/**
 * aggiunge i valori dinamici mancanti
 * @param info
 */
export const fillSchema = (info: GeneratorInfo): void => {
  if (info.monoCycle) return;
  while (!info.isFixedComplete()) {
    // adds fixed numbers
    const first_cell = info.getRandomEmptyCell();
    const availableCount = info.getDeltaFixed();
    if (!first_cell) {
      info.stopped = true;
    } else {
      let cells: EditSudokuCell[] = first_cell ? [first_cell] : [];
      // aggiunge quelle necessarie secondo la simmetria scelta
      cells = cells.concat(info.getSymmetricalCells(first_cell.id));
      // prende solo quelle che è possibile inserire senza superare
      // il numero di celle fisse obiettivo definito dall'utente
      const toAddCount = Math.min(cells.length, availableCount);
      for (let i = 0; i < toAddCount; i++) {
        const cell = cells[i];
        if (!cell.value) cell.value = SUDOKU_STANDARD_CHARACTERS.dynamic;
        info.checkFixedCell(cell);
      }
    }
  }
}

/**
 * FInalizza lo schema
 * @param info
 */
const finalizeSchema = (info: GeneratorInfo): void => {
  if (info.schema && !info.schema.generationMap)
    info.schema.generationMap = new EditSudokuGenerationMap(info.schema);
}

/**
 * Valorizza i valori fissi dinamici secondo le regole del sudoku
 * @param info
 */
export const valorise = (info: GeneratorInfo): void => {

  info.valueCycles++;
  info.cycles++;

  // applica le regole del sudoku
  applySudokuRules(info.schema, { onlyRealFixed: true });

  // valorizza le celle dinamiche secondo la modalità definita
  switch(info.original.options.valorizationMode) {
    case SudokuValorizationMode.random:
      _keys(info.schema?.generationMap?.cellsX||{}).forEach((cid) => {
        const cell = info.schema?.cells[cid];
        if (cell) {
          const vindex = _random(0, (cell.availables || []).length - 1);
          cell.value = cell.availables[vindex];
          applySudokuRules(info.schema);
        }
      });
      break;
    case SudokuValorizationMode.sequential:
      info.fromLastIncrementableIndex((xcell, cell) => {
        xcell.index++;
        cell.value = cell.availables[xcell.index];
        // console.log('XCELL VALORIZATION xcell:', xcell, '\n\tCELL:', cell);
        applySudokuRules(info.schema);
        // console.log('AFTER VALORIZATION AND APPLY SUDOKU RULES:', _clone(info.schema));
      });
      break;
  }
}

/**
 * Riosolve lo schema corrente
 * @param info
 */
export const resolve = (info: GeneratorInfo): SolveAllResult => {
  const sudoku = info.getSudoku();
  const options = new PlaySudokuOptions({
    maxSplitSchema: info.original.options.maxSplitSchema || 500,
    excludeTryAlgorithm: info.original.options.excludeTryAlgorithm
  });
  const solver = new Solver(new PlaySudoku({ sudoku, options }));
  return solver.solve();
}



/**
 * COntesto del generatore di schemi
 */
export class GeneratorInfo {
  constructor(private sdk: EditSudoku) {
    this.startedAt = Date.now();
    this.schemas = {};
    this.schemaCycles = 0;
    this.valueCycles = 0;
    this.original = _clone(sdk);
    this.originalFixed = 0;
    this.fixed = [];
    this.fixedMap = {};
    this.dynamicMap = {};
    this.deltaNumbers = 0;
    this.minDiff = Math.min(this.original.options.minDiff, this.original.options.maxDiff);
    this.maxDiff = Math.max(this.original.options.minDiff, this.original.options.maxDiff);
    this._parseSchema();
  }
  // Schema template
  original: EditSudoku;
  // numero di valori fissi originali
  originalFixed: number;
  // cache degli schemi generati
  schemas: Dictionary<Sudoku>;
  // elenco degli identificativi delle celle con valori fissati (non ci sono le dinamiche)
  fixed: string[];
  fixedMap: Dictionary<boolean>;
  dynamicMap: Dictionary<boolean>;
  // numeri di numeri utili per raggiungere la quota richiesta
  deltaNumbers: number;
  // cicli di schemi
  schemaCycles: number;
  // cicli di valorizzazione
  valueCycles: number;
  // il monociclico si verifica quando _numbers è >= EditSudokuOptions.fixedCount
  // quindi quando lo schema non cambia
  monoCycle = false;
  // valore minino richiesto della difficolta
  minDiff: number;
  // valore massimo richiesto della difficolta
  maxDiff: number;
  // ferma la generazione
  stopped = false;
  // contatore dei cicli totali
  cycles = 0;
  // contatore degli schemi generati
  counter = 0;
  // data-ora di avvio
  startedAt: number;

  schema?: EditSudoku;

  private _checkSchemaCell(cell?: EditSudokuCell) {
    if (!cell) return;
    if (isValue(cell.value, true)) {
      if (!this.fixedMap[cell.id]) {
        this.fixedMap[cell?.id || ''] = true;
        this.fixed.push(cell?.id || '');
        if (isDynamic(cell.value)) this.dynamicMap[cell?.id || ''] = true;
      }
    }
  }

  private _parseSchema() {
    this.original.cellList.forEach(cid => this._checkSchemaCell(this.original.cells[cid]));
    this.originalFixed = this.fixed.length;
    this.monoCycle = this.originalFixed >= this.original.options.fixedCount;
    this.deltaNumbers = this.monoCycle ? this.original.options.fixedCount - this.originalFixed : 0;
  }

  checkFixedCell(cell: EditSudokuCell) {
    this.schema?.checkFixedCell(cell);
    this._checkSchemaCell(cell);
  }

  getFixedAndXCells(sdk?: EditSudoku): EditSudokuCell[] {
    sdk = sdk || this.schema;
    const cells: EditSudokuCell[] = [];
    traverseSchema(sdk, (cid, cell) =>
      (cell?.fixed || isDynamic(cell?.value || '')) ? cells.push(<EditSudokuCell>cell) : null);
    return cells;
  }

  /**
   * Vero quando il numero di valori fissi (fissi+dinamici) raggiunge
   * quello impostato
   */
  isFixedComplete(): boolean {
    const rank = getRank(this.original);
    const count = this.original.options.fixedCount;
    const fax = this.getFixedAndXCells();
    return this.stopped || !this.schema || count <= 0 || count > (rank * rank) || fax.length >= count;
  }

  private _isEnded(): boolean {
    // ha raggiunto lo scopo della generazione
    switch (this.original.options.generationEndMode) {
      case SudokuEndGenerationMode.afterN:
        if (this.counter >= (this.original.options.generationEndValue || 1)) return true;
        break;
      case SudokuEndGenerationMode.afterTime:
        const elapsed = Date.now() - this.startedAt;
        if (elapsed >= ((this.original.options.generationEndValue || 600) * 1000)) return true;
        break;
    }
    // ha superato i cicli per schema
    if (this.schemaCycles >= this.original.options.maxSchemaCycles) return true;
    // è stato stoppato
    if (this.stopped) return true;

    return false;
  }

  /**
   * Ritorna vero se lo schema può essere valorizzato
   */
  canBeValorised(): boolean {
    // non deve aver raggiunto lo scopo della generazione
    if (this._isEnded()) return false;
    // deve avere numeri fissi dinamici
    if (this.monoCycle) return false;
    // deve avere possibilità di valorizzazione secondo la generationMap
    switch (this.original.options.valorizationMode) {
      case SudokuValorizationMode.sequential:
        return !!(this.schema?.generationMap?.fixedCells||[]).find(c => c.isValueX && c.index < (((this.schema?.cells||{})[c.id]?.availables||[]).length - 1));
      case SudokuValorizationMode.random:
        // non deve avere raggiunto il limite dei cicli di valorizzazione
        if (this.valueCycles >= this.original.options.maxValueCycles) return false;

        // TODO: termine della valorizzazione casuale sulla ripetizione di schemi già fatti

        return true;
      default:
        return true;
    }
  }

  /**
   * Ritorna vero se lo schema può essere ciclato
   */
  canBeCycled(): boolean {
    // non deve aver raggiunto lo scopo della generazione
    if (this._isEnded()) return false;
    // l'originale deve avere un numero di (valori fissi + dinamici) inferiore all'opzione original.options.fixedCount
    const fax = this.getFixedAndXCells(this.original);
    return fax.length < this.original.options.fixedCount;
  }

  /**
   * Inizializza un nuovo ciclo
   */
  newCycle() {
    this.schemaCycles++;
    this.valueCycles = 0;
    // inizializza lo schema di lavoro
    this.schema = initSchema(this.original);
    // aggiunge i valori mancanti (come celle dinamiche)
    fillSchema(this);
    // finalizza la costruzione dello schema
    finalizeSchema(this);
    // log schemacreato
    //console.log('NEW SCHEMA >>>> ', getValues(this.schema));
  }

  /**
   * Resituisce la stringa con i valori fissi (anche le celle dinamiche devono essere fisse)
   */
  getSchemaFixedValues() {
    let fixed = '';
    traverseSchema(this.schema, (cid, cell) =>
      fixed = `${fixed}${this.fixedMap[cell?.id || ''] ? cell?.value||'' : SUDOKU_STANDARD_CHARACTERS.empty}`);
    return fixed;
  }

  /**
   * Restituisce il numero di celle fisse necessarie per arrivare
   * al numero di valori richiesto
   */
  getDeltaFixed(): number {
    const fixedCount = this.getFixedAndXCells().length;
    if (this.original.options.fixedCount > fixedCount) return this.original.options.fixedCount - fixedCount;
    return 0;
  }

  /**
   * restituisce una cella a caso tra quelle vuote
   */
  getRandomEmptyCell(): EditSudokuCell|undefined {
    const cells = this.schema?.cells||{};
    const emptyCells = _keys(cells).filter(k => !cells[k]?.value);
    const rnd_pos = _random(0, emptyCells.length - 1);
    return cells[emptyCells[rnd_pos]];
  }

  /**
   * Restituisce le celle simmetriche rispetto a quella passata
   * secondo le impostazioni utente
   * @param cid
   */
  getSymmetricalCells(cid: string): EditSudokuCell[] {
    if (!cid) return [];
    const cells = this.schema?.cells||{};
    const info = decodeCellId(cid);
    let other_ids: string[] = [];
    const last = this.original.options.rank - 1;
    switch (this.original.options.symmetry) {
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
    return <EditSudokuCell[]>(other_ids.map(oid => cells[oid]).filter(c => !!c));
  }

  /**
   * Restituisce lo schema per il solver
   */
  getSudoku() {
    return new Sudoku({
      rank: this.original.options.rank,
      fixed: this.getSchemaFixedValues()
    });
  }

  /**
   * Restituisce lo schema dalla soluzione
   * @param result
   */
  getSolutionSudoku(result: SolveAllResult): Sudoku|undefined {
    return getSolutionSudoku(result?.unique, {
      sudokulab: true,
      symmetry: this.original.options.symmetry
    });
  }

  /**
   * Verifica lo schema risultato del solver
   * @param schema
   */
  isARightSolution(schema?: Sudoku): boolean {
    if (!schema) return false;
    if (!!this.schemas[`${schema?._id||0}`]) return false;
    if (!schema?.info) return false;
    // verifica l'utilizzo del try-algorithm
    if (this.original.options.excludeTryAlgorithm && schema.info.useTryAlgorithm) return false;
    // verifica del livello di difficoltà
    if (schema.info.difficultyValue > this.maxDiff || schema.info.difficultyValue < this.minDiff) return false;
    return true;
  }

  /**
   * Aggiunge la soluzione alla cache
   * @param sol
   */
  addSchema(sol: Sudoku) {
    this.schemas[`${sol._id || 0}`] = sol;
    this.counter++;
  }

  /**
   * Cicla dall'ultima cella dove sia possibile aumentare l'indice del valore possibile
   */
  fromLastIncrementableIndex(handler: (xCell: GenerationMapCellInfo, cell: EditSudokuCell) => any) {
    const fxCells = (this.schema?.generationMap?.fixedCells || []);
    const xCells = fxCells.filter(c => c.isValueX);
    let index: number;
    const vc = xCells.find(c => c.index >= 0);
    if (!vc) {
      // console.log('FIRST VALORIZATION ');
      index = 0;
    } else {
      index = _findLastIndex(xCells, c => c.index < (this.schema?.cells[c.id]?.availables || []).length - 1);
      const xCell = xCells[index];
      const cell = this.schema?.cells[xCell.id]||{};
      // console.log('FIND LAST INDEX = ', index, '\n\rXCELL', xCells[index], '\n\rCELL', cell);
      if (index > -1) {
        const rank = getRank(this.schema);
        // resetta tutte le x-celle dopo l'indice
        if (index < xCells.length - 1) {
          for (let i = index + 1; i < xCells.length; i++) {
            const xCell = xCells[i];
            const cell = this.schema?.cells[xCell.id];
            if (cell) {
              cell.value = SUDOKU_STANDARD_CHARACTERS.dynamic;
              cell.availables = getAvailables(rank);
              xCell.index = -1;
            }
          }
        }
        // applica le regole del sudoku per ripristinare
        // i valori ammissibili nelle x-celle resettate
        applySudokuRules(this.schema);
      }
    }
    // effettua il ciclo
    for (let i = index; i < xCells.length; i++) {
      const xCell = xCells[i];
      const cell = this.schema?.cells[xCell.id];
      if (cell) handler(xCell, cell);
    }
  }
}
