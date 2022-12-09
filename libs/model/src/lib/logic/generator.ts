import {
  cloneDeep as _clone,
  findLastIndex as _findLastIndex,
  keys as _keys,
  random as _random,
  reduce as _reduce,
  remove as _remove
} from 'lodash';
import {EditSudoku, EditSudokuGenerationMap, GenerationMapCellInfo} from '../EditSudoku';
import {GeneratorFacade} from '../GeneratorFacade';
import {Dictionary} from '@ngrx/entity';
import {
  applySudokuRules,
  cellId,
  decodeCellId,
  EditSudokuCell,
  EditSudokuValorizationMode,
  getAvailables,
  getRank,
  getSolutionSudoku,
  getSudoku,
  isValue,
  PlaySudoku,
  PlaySudokuOptions,
  SolveAllResult,
  Solver,
  Sudoku,
  SUDOKU_DYNAMIC_VALUE,
  SUDOKU_EMPTY_VALUE,
  SudokuSymmetry,
  traverseSchema,
  use,
  WorkingInfo
} from '@sudokulab/model';
import {combineLatest} from "rxjs";

class GeneratorInfo {
  constructor(private sdk: EditSudoku) {
    this.startedAt = Date.now();
    this.schemas = {};
    this.schemaCycles = 0;
    this.valueCycles = 0;
    this.original = _clone(sdk);
    this.dynamics = [];
    this.dynamicsdMap = {};
    this.fixed = [];
    this.fixedMap = {};
    this.numbers = 0;
    this.deltaNumbers = 0;
    this.minDiff = Math.min(this.original.options.minDiff, this.original.options.maxDiff);
    this.maxDiff = Math.max(this.original.options.minDiff, this.original.options.maxDiff);
    this._parseSchema();
  }
  // Schema template
  original: EditSudoku;
  // cache degli schemi generati
  schemas: Dictionary<Sudoku>;
  // elenco degli identificativi delle celle dinamiche
  dynamics: string[];
  dynamicsdMap: Dictionary<boolean>;
  // elenco degli identificativi delle celle con valori fissati (non ci sono le dinamiche)
  fixed: string[];
  fixedMap: Dictionary<boolean>;
  // numero di numeri nello schema (dinamici e non)
  numbers: number;
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

  checkFixedCell(cell: EditSudokuCell) {
    this.schema?.checkFixedCell(cell);
    if (cell?.value === SUDOKU_DYNAMIC_VALUE) {
      if (!this.dynamicsdMap[cell.id]) {
        this.dynamics.push(cell.id);
        this.dynamicsdMap[cell.id] = true;
        this.numbers++;
      }
    } else if (isValue(cell?.value)) {
      if (!this.fixedMap[cell.id]) {
        this.fixed.push(cell?.id || '');
        this.fixedMap[cell?.id || ''] = true;
        this.numbers++;
      }
    }
  }

  private _parseSchema() {
    this.original.cellList.forEach(cid => {
      const cell = this.original.cells[cid];
      if (cell?.value === SUDOKU_DYNAMIC_VALUE) {
        this.dynamics.push(cell.id);
        this.dynamicsdMap[cell.id] = true;
        this.numbers++;
      } else if (isValue(cell?.value)) {
        this.fixed.push(cell?.id||'');
        this.fixedMap[cell?.id||''] = true;
        this.numbers++;
      }
    });
    this.monoCycle = this.numbers >= this.original.options.fixedCount;
    this.deltaNumbers = this.monoCycle ? this.original.options.fixedCount - this.numbers : 0;
  }

  getfixedAndXCells(sdk?: EditSudoku): EditSudokuCell[] {
    sdk = sdk || this.schema;
    const cells: EditSudokuCell[] = [];
    traverseSchema(sdk, (cid, cell) =>
      (cell?.fixed || cell?.value === SUDOKU_DYNAMIC_VALUE) ? cells.push(cell) : null);
    return cells;
  }

  isFixedComplete(): boolean {
    const rank = getRank(this.original);
    const count = this.original.options.fixedCount;
    return this.stopped || !this.schema || count <= 0 || count > (rank * rank) || this.getfixedAndXCells().length >= count;
  }

  /**
   * Ritorna vero se lo schema può essere valorizzato
   */
  canBeValorised(): boolean {
    // non deve aver raggiunto lo scopo della generazione
    if (this.schemaCycles >= this.original.options.maxSchemaCycles) return false;
    // non deve essere stopped
    if (this.stopped) return false;
    // deve avere numeri fissi dinamici
    if (this.fixed.length >= this.original.options.fixedCount) return false;
    // deve avere possibilità di valorizzazione secondo la generationMap
    switch (this.original.options.valorizationMode) {
      case EditSudokuValorizationMode.sequential:
        return !!(this.schema?.generationMap?.fixedCells||[]).find(c => c.isValueX && c.index < (((this.schema?.cells||{})[c.id]?.availables||[]).length - 1));
      case EditSudokuValorizationMode.random:
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
    if (this.original.options.maxSchemaCycles <= this.schemaCycles) return false;
    // non deve essere stopped
    if (this.stopped) return false;
    // l'originale deve avere un numero di (valori fissi + dinamici) inferiore all'opzione original.options.fixedCount
    return this.getfixedAndXCells(this.original).length < this.original.options.fixedCount;
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
  }

  /**
   * Resituisce la stringa con i valori fissi (anche le celle dinamiche devono essere fisse)
   */
  getSchemaFixedValues() {
    let fixed = '';
    traverseSchema(this.schema, (cid, cell) =>
      fixed = `${fixed}${(this.fixedMap[cell?.id || ''] || this.dynamicsdMap[cell?.id || '']) ? cell?.value||'' : SUDOKU_EMPTY_VALUE}`);
    return fixed;
  }

  /**
   * Restituisce il numero di celle fisse necessarie per arrivare
   * al numero di valori richiesto
   */
  getDeltaFixed(): number {
    const fixedCount = this.getfixedAndXCells().length;
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
              cell.value = SUDOKU_DYNAMIC_VALUE;
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


/**
 * Generatore di schemi
 */
export class Generator {
  private readonly _info: GeneratorInfo;

  constructor(private sdk: EditSudoku,
              private _facade: GeneratorFacade) {
    this._info = new GeneratorInfo(sdk);
  }

  /**
   * valorizza lo schema se richiede valorizzazione
   * poi risolve lo schema
   * @private
   */
  private _valoriseAndResolve() {
    // valorizza lo schema
    valorise(this._info);
    // imposta lo schema da risolvere
    const sudoku = this._info.schema ? getSudoku(this._info.schema) : undefined;
    this._facade.setWorkingInfo(new WorkingInfo({sudoku, counter: this._info.cycles, startedAt: this._info.startedAt}));
    console.log('SCHEMA: ', sudoku?.fixed);
    // prova a risolverlo
    const result = resolve(this._info);
    // se lo ha risolto...
    if (!!result.unique) {
      const sol = this._info.getSolutionSudoku(result);
      // valuta le strategie di out
      if (sol && this._info.isARightSolution(sol)) {
        this._facade.addSchema(sol);
        this._info.addSchema(sol);
      }
    }
  }

  private _next() {
    if (this._info.stopped) return;
    // 1. valorizza lo schema se richiede valorizzazione
    // 2. risolve lo schema
    this._valoriseAndResolve();
    this._info.valueCycles++;
    this._info.cycles++;
    if (this._info.canBeValorised()) {
      use(combineLatest(this._facade.selectGeneratorIsStopping$, this._facade.selectGeneratorIsRunning$),
        ([stopping, running]) => {
          this._info.stopped = stopping || !running;
          setTimeout(() => this._next(), 50);
        });
    } else {
      // 3. valuta il risultato
      //    - se ha ragiunto lo scopo va la punto (4)
      //    - se può essere nuovamente valorizzato torna al punto (1)
      //    - se può essere ciclato rilancia la generate()
      //    - altrimenti ha finito (4)
      if (this._info.canBeCycled()) this.generate();
      // 4. fine della generazione
    }
  }

  /**
   * Richiede l'interruzione della generazione
   */
  stop() {
    this._info.stopped = true;
  }

  /**
   * Avvia la generazione
   */
  generate() {
    // incrementa i cicli di schemi
    this._info.newCycle();
    // avvia i cicli di valorizzazione e risoluzione
    this._next();
  }
}

/**
 * verifica la consistenza dello schema
 * @param sdk
 */
const _checkSchema = (sdk: EditSudoku) => {
  sdk.fixed = _reduce(sdk.cells, (cll, c) => c?.fixed ? cll.concat(c?.id||'') : cll, <string[]>[]);
  if (!sdk.originalSchema)
    sdk.originalSchema = sdk.cellList.map(cid => sdk.cells[cid]).map(c => c?.value||SUDOKU_EMPTY_VALUE).join('');
}

/**
 * Inizializza lo schema
 * @param sdk
 */
const initSchema = (sdk: EditSudoku): EditSudoku => {
  const csdk = _clone(sdk);
  _checkSchema(csdk);
  return csdk;
}

/**
 * aggiunge i valori fissi mancanti (non valorizza i dinamici)
 * @param info
 */
const fillSchema = (info: GeneratorInfo): void => {
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
        if (!cell.value) cell.value = SUDOKU_DYNAMIC_VALUE;
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
const valorise = (info: GeneratorInfo): void => {

  // applica le regole del sudoku
  applySudokuRules(info.schema, { onlyRealFixed: true });

  // valorizza le celle dinamiche secondo la modalità definita
  switch(info.original.options.valorizationMode) {
    case EditSudokuValorizationMode.random:
      _keys(info.schema?.generationMap?.cellsX||{}).forEach((cid) => {
        const cell = info.schema?.cells[cid];
        if (cell) {
          const vindex = _random(0, (cell.availables || []).length - 1);
          cell.value = cell.availables[vindex];
          applySudokuRules(info.schema);
        }
      });
      break;
    case EditSudokuValorizationMode.sequential:
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
const resolve = (info: GeneratorInfo): SolveAllResult => {
  const sudoku = info.getSudoku();
  const options = new PlaySudokuOptions({
    maxSplitSchema: info.original.options.maxSplitSchema || 500,
    excludeTryAlgorithm: info.original.options.excludeTryAlgorithm
  });
  const solver = new Solver(new PlaySudoku({ sudoku, options }));
  return solver.solve();
}
