import {EditSudoku} from "../EditSudoku";
import {GeneratorFacade} from "../GeneratorFacade";
import {use} from "../../global.helper";
import {combineLatest} from "rxjs";
import {fillSchema, GeneratorInfo, resolve, valorise} from "./generator.helper";
import {WorkingInfo} from "../WorkingInfo";
import {getSudoku} from "../../generator.helper";

const STEP_TIMEOUT = 100;

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
    this._facade.setWorkingInfo(new WorkingInfo({sudoku, counter: this._info.valueCycles, startedAt: this._info.startedAt}));
    // prova a risolverlo
    const result = resolve(this._info);
    // se lo ha risolto...
    if (!!result.unique) {
      console.log('SCHEMA: ', sudoku?.fixed, ' UNIQUE!!!');
      const sol = this._info.getSolutionSudoku(result);
      // valuta le strategie di out
      if (sol && this._info.isARightSolution(sol)) {
        this._facade.addSchema(sol);
        this._info.addSchema(sol);
      }
    } else {
      console.log('SCHEMA: ', sudoku?.fixed, ' ', result.reason);
    }
  }

  private _next() {
    if (this._info.stopped) return;

    // TODO: i valori aggiunti dal processo dovrebbero rimanere dynamici fino al cambio schema...

    // 1. valorizza lo schema se richiede valorizzazione e tenta di risolverlo
    this._valoriseAndResolve();

    use(combineLatest([this._facade.selectGeneratorIsStopping$, this._facade.selectGeneratorIsRunning$]),
      ([stopping, running]) => {
        this._info.stopped = stopping || !running;
        if (this._info.canBeValorised()) {
          // 2. se può essere valorizzato passa allo step successivo
          setTimeout(() => this._next(), STEP_TIMEOUT);
        } else if (this._info.canBeCycled()) {
          // 3. se può essere ciclato lancia un nuovo ciclo di generazione
          this.generate();
        } else {
          // 4. fine della generazione
          this._facade.end();
        }
      });
  }

  /**
   * Avvia la generazione
   */
  generate() {
    setTimeout(() => {
      // incrementa i cicli di schemi
      this._info.newCycle();
      // avvia i cicli di valorizzazione e risoluzione
      this._next();
    }, STEP_TIMEOUT);
  }
}

/**
 * aggiunge nuovi fixed se il numero di quelli inseriti è minore dell numero previsto
 *  - rispetta la simmetria se specificata
 * @param sdk
 */
export const fillSchemaNumbers = (sdk: EditSudoku) => {
  const info = new GeneratorInfo(sdk);
  fillSchema(info);
  return info.schema;
}
