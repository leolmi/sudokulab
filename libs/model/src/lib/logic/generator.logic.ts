import { EditSudoku } from '../EditSudoku';
import { Sudoku } from '../Sudoku';
import { GeneratorFacade } from '../GeneratorFacade';
import { cloneDeep as _clone } from 'lodash';
import { checkNumbers, checkValues, initSchema, isOnEnd, resetSchema, solveSchema } from './generator.helper';
import { SudokuSolution } from '../SudokuSolution';
import { BehaviorSubject } from 'rxjs';
import { updateBehaviorSubject, use } from '../../sudoku-helper';


export class Generator {
  generating: number;
  schemas$: BehaviorSubject<Sudoku[]>;
  private _workSdk: EditSudoku;
  constructor(private _sdk: EditSudoku, private _facade: GeneratorFacade) {
    this.generating = 0;
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);
    this._workSdk = _clone(this._sdk);
  }

  private _end() {
    this.generating = 0;
  }

  get facade() { return this._facade; }

  get sdk() { return this._sdk; }

  private _isRightSolution(solution: SudokuSolution): boolean {
    const info = solution.sdk.sudoku?.info;
    if (!info) return false;
    // verifica l'utilizzo del try-algorithm
    if (this._workSdk.options.excludeTryAlgorithm && info.useTryAlgorithm) return false;
    // verifica del livello di difficoltà
    const minDiff = Math.min(this._workSdk.options.minDiff, this._workSdk.options.maxDiff);
    const maxDiff = Math.max(this._workSdk.options.minDiff, this._workSdk.options.maxDiff);
    if (info.difficultyValue > maxDiff || info.difficultyValue < minDiff) return false;
    return true;
  }

  private _generate() {
    // 1. inizializza lo schema
    initSchema(this._workSdk);
    // 2. aggiunge nuovi fixed se il numero di quelli inseriti è minore dell numero previsto
    checkNumbers(this._workSdk);
    // 3. valorizzazione dei fixed vuoti (sequenziale)
    if (checkValues(this._workSdk)) {
      // 4. soluzione
      const sol = solveSchema(this._workSdk);
      // 5. se unica salva schema altrimenti skippa
      if (!!sol.unique) {
        const schema = sol.unique.sdk.sudoku;
        if (!!schema && this._isRightSolution(sol.unique)) {
          updateBehaviorSubject(this.schemas$, sch => !!sch.push(schema));
        }
      }
      resetSchema(this._workSdk);
    }

    isOnEnd(this, ended => {
      if (ended) return this._end();
      setTimeout(() => this._generate(), 250);
    });
  }

  generate() {
    this.generating = performance.now();
    this._workSdk = _clone(this._sdk);
    this._generate();
  }
}


