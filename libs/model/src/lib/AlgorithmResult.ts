import {PlaySudoku} from "./PlaySudoku";
import {getValues} from "../sudoku.helper";

/**
 * singolo item descrittivo legato all'applicazione di un determinato algoritmo
 */
export class AlgorithmResultLine {
  constructor(l?: Partial<AlgorithmResultLine>) {
    this.description = '';
    this.cell = '';
    this.others = [];
    this.withValue = false;
    Object.assign(this, l || {});
  }
  // descrizione dell'item
  description: string;
  // cella interessata dall'esecuzione dell'algoritmo
  cell: string;
  // altre celle coinvolte nell'applicazione dell'algorito
  others: string[];
  // se vero l'applicazione porta alla valorizzazione della cella
  withValue: boolean;
}

/**
 * Risultati dell'applicazione di un determinato algoritmo
 */
export class AlgorithmResult {
  constructor(r?: Partial<AlgorithmResult>, sdk?: PlaySudoku) {
    this.algorithm = '';
    this.values = sdk ? getValues(sdk) : '';
    this.descLines = [];
    this.cases = [];
    this.cells = [];
    this.applied = false;
    Object.assign(this, r || {});
  }

  /**
   * algoritmo di riferimento
   */
  algorithm: string;
  /**
   * valori
   */
  values: string;
  /**
   * valore (opzionale)
   */
  value?: string;
  /**
   * item descrittivi dell'esecuzione dell'algoritmo
   */
  descLines: AlgorithmResultLine[];
  /**
   * sviluppo dello schema in altri sotto-schemi
   */
  cases: PlaySudoku[];
  /**
   * celle interessate
   */
  cells: string[];
  /**
   * se vero l'algoritmo è stato applicato
   */
  applied: boolean;

  /**
   * restituisce l'applicazione dell'algoritmo senza successo
   * @param alg
   */
  static none(alg: Algorithm): AlgorithmResult {
    return new AlgorithmResult({
      algorithm: alg.name,
      applied: false
    })
  }
}
