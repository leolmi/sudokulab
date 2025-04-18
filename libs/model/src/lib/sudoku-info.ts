import { DEFAULT_RANK, Symmetry } from './consts';
import { AlgorithmResult } from './algorithm';
import { Difficulty } from './difficulty';
import { VERSION } from './version';

/**
 * informazioni di base sullo schema
 */
export class SudokuInfo extends Difficulty {
  constructor(i?: Partial<SudokuInfo>) {
    super(i);

    this.rank = i?.rank||DEFAULT_RANK;
    this.fixedCount = i?.fixedCount||0;
    this.symmetry = i?.symmetry||Symmetry.none;
    this.unique = !!i?.unique;
    this.version = i?.version||VERSION;
    this.origin = i?.origin||'';
  }

  /**
   * rank dello schema
   */
  rank: number;
  /**
   * numero di valori fissi
   */
  fixedCount: number;
  /**
   * simmetria
   */
  symmetry: Symmetry;
  /**
   * unicità della soluzione
   */
  unique: boolean;
  /**
   * versione
   */
  version: string;
  /**
   * origine dello schema
   */
  origin: string;
}


export class SudokuInfoEx extends SudokuInfo {
  constructor(i?: Partial<SudokuInfoEx>) {
    super(i);

    this.solution = (i?.solution||[]).map(r => new AlgorithmResult(r));
  }

  /**
   * soluzione (elenco algoritmi utilizzati)
   */
  solution: AlgorithmResult[];
}
