import { Observable } from 'rxjs';
import { PlaySudoku, Sudoku } from '@sudokulab/model';

export abstract class SudokuFacade {
  abstract selectActiveSudoku$: Observable<PlaySudoku|undefined>;
  abstract selectActiveCell$: Observable<string>;

  abstract loadSudoku(sudoku: Sudoku): void;
  abstract setActiveSudoku(id: string): void;
  abstract setActiveCell(id: string): void;
  abstract applyAlgorithm(algorithm: string): void;
  abstract solveStep(): void;
  abstract setValue(value: string): void;
  abstract move(direction: string): void;
  abstract clear(): void;
}
