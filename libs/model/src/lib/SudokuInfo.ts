import { SudokuSymmetry } from './enums';
import { SudokuSolution } from './SudokuSolution';

export class SudokuInfo {
  constructor(s?: Partial<SudokuInfo>) {
    this.symmetry = SudokuSymmetry.central;
    this.difficulty = 0;
    this.solutions = [];
    Object.assign(this, s || {});
  }
  symmetry: SudokuSymmetry;
  difficulty: number;
  solutions: SudokuSolution[];
}
