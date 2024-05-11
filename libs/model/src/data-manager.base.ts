import {BoardData, SudokuData} from "./lib/tokens";
import {Subject} from "rxjs";
import {Sudoku} from "./lib/Sudoku";
import {getSudoku} from "./generator.helper";

export class DataManagerBase {
  protected readonly _destroy$: Subject<void>;
  changed$: Subject<void>;
  data: BoardData;

  constructor(_data?: SudokuData<any>) {
    this.data = <BoardData>_data || new BoardData();
    this._destroy$ = new Subject<void>();
    this.changed$ = new Subject<void>();
  }

  dispose() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }

  /**
   * restituisce il sudoku attivo
   */
  getSudoku(): Sudoku {
    if (!this.data) return new Sudoku();
    const sdk = this.data.sdk$.value;
    return getSudoku(sdk);
  }
}
