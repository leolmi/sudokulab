import { Observable } from 'rxjs';
import { PlaySudoku, Sudoku, SudokuMessage } from '@sudokulab/model';

export abstract class SudokuFacade {
  abstract selectActiveSudoku$: Observable<PlaySudoku|undefined>;
  abstract selectActiveCell$: Observable<string>;
  abstract selectActiveMessage$: Observable<SudokuMessage|undefined>;

  abstract loadSudoku(sudoku: Sudoku): void;
  abstract setActiveSudoku(id: string): void;
  abstract setActiveCell(id: string): void;
  abstract applyAlgorithm(algorithm: string): void;
  abstract solveStep(): void;
  abstract solve(): void;
  abstract setValue(value: string): void;
  abstract move(direction: string): void;
  abstract raiseMessage(message: SudokuMessage): void;
  abstract clear(): void;
}
