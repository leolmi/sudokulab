import { EditSudoku } from '../EditSudoku';
import { Sudoku } from '../Sudoku';
import { GeneratorFacade } from '../GeneratorFacade';
import { cloneDeep as _clone } from 'lodash';
import {
  checkNumbers,
  checkSchema,
  checkValues,
  getSudoku,
  initSchema,
  isOnEnd,
  resetSchema,
  resetSchemaMap,
  solveSchema
} from './generator.helper';
import { getSolutionSudoku, getValues } from '../../sudoku.helper';
import { WorkingInfo } from '../WorkingInfo';
import { Dictionary } from '@ngrx/entity';
import { SDK_PREFIX } from '../consts';


export class Generator {
  schemas: Dictionary<Sudoku>;
  private _workSdk: EditSudoku;
  private _counter: number;
  private _cycles: number;
  generating: number;
  constructor(private _sdk: EditSudoku, private _facade: GeneratorFacade) {
    this.generating = 0;
    this._counter = 0;
    this._cycles = 0;
    this.schemas = {};
    this._workSdk = _clone(this._sdk);
  }

  private _end() {
    this.generating = 0;
    this._facade.end();
  }

  get facade() { return this._facade; }

  get sdk() { return this._sdk; }

  private _isRightSolution(schema: Sudoku): boolean {
    if (!!this.schemas[`${schema?._id||0}`]) return false;
    if (!schema?.info) return false;
    // verifica l'utilizzo del try-algorithm
    if (this._workSdk.options.excludeTryAlgorithm && schema.info.useTryAlgorithm) return false;
    // verifica del livello di difficoltà
    const minDiff = Math.min(this._workSdk.options.minDiff, this._workSdk.options.maxDiff);
    const maxDiff = Math.max(this._workSdk.options.minDiff, this._workSdk.options.maxDiff);
    if (schema.info.difficultyValue > maxDiff || schema.info.difficultyValue < minDiff) return false;
    return true;
  }

  private _generate() {
    this._counter++;
    this._cycles++;
    // 1. inizializza lo schema
    initSchema(this._workSdk);
    // console.log(...SDK_PREFIX, 'initialized schema', _clone(this._workSdk.cells));
    // 2. aggiunge nuovi fixed se il numero di quelli inseriti è minore dell numero previsto
    if (checkNumbers(this._workSdk)) {
      // potrebbe aver aggiunto celle fisse dinamiche > aggiornare la mappa
      resetSchemaMap(this._workSdk);
    }
    checkSchema(this._workSdk);
    // console.log(...SDK_PREFIX, 'checked numbers schema', _clone(this._workSdk.cells));
    // 3. valorizzazione dei fixed vuoti (sequenziale)
    this._facade.setWorkingInfo(new WorkingInfo({
      sudoku: getSudoku(this._workSdk),
      counter: this._counter,
      startedAt: this.generating
    }));
    if (this._cycles < this._workSdk.options.maxSchemaCycles && checkValues(this._workSdk)) {
      // console.log(...SDK_PREFIX, 'checked values schema', _clone(this._workSdk.cells));
      // console.log(...SDK_PREFIX, 'SCHEMA', getValues(this._workSdk));
      // 4. soluzione
      const sol = solveSchema(this._workSdk);
      // 5. se unica salva schema altrimenti skippa
      // console.log(...SDK_PREFIX, 'solved schema', sol);
      if (!!sol.unique) {
        const schema = getSolutionSudoku(sol.unique, { sudokulab: true });
        if (!!schema && this._isRightSolution(schema)) {
          this._facade.addSchema(schema);
          this.schemas[`${schema._id||0}`] = schema;
          this._counter = 0;
          this._cycles = 0;
        }
      } else {
        console.log(...SDK_PREFIX, 'not resolved', getValues(this._workSdk));
      }
      // resetSchema(this._workSdk);
      // console.log(...SDK_PREFIX, 'resetted schema', _clone(this._workSdk.cells));
    } else {
      resetSchema(this._workSdk);
      this._cycles = 0;
    }

    isOnEnd(this, ended => {
      if (ended) return this._end();
      setTimeout(() => this._generate(), 250);
    });
  }

  generate() {
    this.generating = performance.now();
    this._counter = 0;
    this._cycles = 0;
    this._workSdk = _clone(this._sdk);
    this._workSdk.originalSchema = getValues(this._workSdk);
    this._generate();
  }
}


