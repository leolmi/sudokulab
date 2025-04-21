import { SudokuInfoEx } from './sudoku-info';
import { UserValues } from './user-values';

export class SudokuStat extends SudokuInfoEx {
  constructor(s?: Partial<SudokuStat>) {
    super(s);

    this.dynamicCount = s?.dynamicCount || 0;
    this.dynamicEmptyCount = s?.dynamicEmptyCount || 0;
    this.fixedAndDynamicCount = s?.fixedAndDynamicCount || 0;
    this.userCount = s?.userCount || 0;
    this.missingCount = s?.missingCount || 0;
    this.percent = s?.percent || 0;
    this.hasErrors = !!s?.hasErrors;
    this.isSolvable = !!s?.isSolvable;
    this.isComplete = !!s?.isComplete;
    this.userValues = new UserValues(s?.userValues);
    // calcolati:
    this.isEmpty = (s?.fixedCount || 0) === 0;
    this.cellCount = s?.cellCount || this.rank * this.rank;
    this.rankStr = s?.rankStr || `${this.rank}x${this.rank}`;
    this.totalMissingCount = this.cellCount - this.fixedCount;
  }

  /**
   * rank in formato stringa
   */
  rankStr: string;
  /**
   * numero di celle totale
   */
  cellCount: number;
  /**
   * numero di valori dinamici
   */
  dynamicCount: number;
  /**
   * numero di valori dinamici non valorizzati
   */
  dynamicEmptyCount: number;
  /**
   * numero di valori fissi e dinamici
   */
  fixedAndDynamicCount: number;
  /**
   * numero di valori inseriti
   */
  userCount: number;
  /**
   * valori presenti nello schema (fissi+utente)
   */
  userValues: UserValues;
  /**
   * numero di valori mancanti
   */
  missingCount: number;
  /**
   * numero di valori mancanti iniziale
   */
  totalMissingCount: number;
  /**
   * percentuale di riempimento
   */
  percent: number;
  /**
   * vero se risolvibile
   */
  isSolvable: boolean;
  /**
   * vero se completato;
   */
  isComplete: boolean;
  /**
   * vero se vuoto
   */
  isEmpty: boolean;
  /**
   * presenza di errori
   */
  hasErrors: boolean;
}
