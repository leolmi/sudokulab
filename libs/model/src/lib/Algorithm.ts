import { AlgorithmType } from './consts';
import { SudokuCell } from './sudoku-cell';
import { Highlights } from './highlights';
import { SudokuStat } from './sudoku-stat';

export class AlgorithmResultLine {
  constructor(l?: Partial<AlgorithmResultLine>) {
    Object.assign(<any>this, l || {});

    this.cell = l?.cell||'';
    this.description = l?.description||'';
    this.withValue = !!l?.withValue;
  }
  cell: string;
  description: string;
  withValue: boolean;
}

/**
 * Risultati dell'applicazione di un determinato algoritmo
 */
export class AlgorithmResult {
  constructor(r?: Partial<AlgorithmResult>) {
    Object.assign(<any>this, r || {});
    this.algorithm = r?.algorithm||'';
    this.cellsSnapshot = r?.cellsSnapshot||[];
    this.descLines = r?.descLines||[];
    this.cases = r?.cases||[];
    this.cells = r?.cells||[];
    this.applied = !!r?.applied;
    this.allowHidden = !!r?.allowHidden;
    this.highlights = new Highlights(r?.highlights);
    this.stat = new SudokuStat(r?.stat);
  }

  /**
   * algoritmo di riferimento
   */
  algorithm: string;
  /**
   * stato delle celle una volta applicato questo algoritmo
   */
  cellsSnapshot: SudokuCell[];
  /**
   * valori
   */
  values?: string;
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
  cases: SudokuCell[][];
  /**
   * celle interessate
   */
  cells: string[];
  /**
   * stato dello schema
   */
  stat: SudokuStat;
  /**
   * evidenze
   */
  highlights: Partial<Highlights>;
  /**
   * se vero l'algoritmo è stato applicato
   */
  applied: boolean;
  /**
   * se vero permette di nascondere il valore inseribile
   */
  allowHidden: boolean;
}

export interface AlgorithmOptions {
  checkAvailableOnStep?: boolean;
}

/**
 * Algoritmo
 */
export abstract class Algorithm {
  abstract id: string;
  abstract name: string;
  /**
   * priorità
   */
  abstract priority: number;
  /**
   * icona rappresentativa
   */
  abstract icon: string;
  /**
   * tipologia di algoritmo
   * - `solver`: risolutivo;
   * - `support`: contributivo;
   */
  abstract type: AlgorithmType;
  /**
   * fattore di calcolo contributivo della difficoltà
   */
  abstract factor: string;
  abstract title: string;
  abstract description: string;
  /**
   * opzioni di funzionamento
   */
  abstract options: AlgorithmOptions

  abstract apply(cells: SudokuCell[]): AlgorithmResult;
}
