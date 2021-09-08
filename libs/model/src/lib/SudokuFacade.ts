import { Observable } from 'rxjs';
import { PlaySudoku, Sudoku } from '@sudokulab/model';

export abstract class SudokuFacade {
  abstract selectActiveSudoku$: Observable<PlaySudoku|undefined>;

  abstract loadSudoku(sudoku: Sudoku): void;
  abstract setActiveSudoku(id: string): void;
  abstract applyAlgorithm(algorithm: string): void;
  abstract solveStep(): void;
  abstract test(): void;
}
