import { SudokuSymmetry } from './enums';

export class SudokuInfo {
  constructor(s?: SudokuInfo) {
    this.symmetry = SudokuSymmetry.central;
    this.difficulty = 0;
    Object.assign(this, s || {});
  }
  symmetry: SudokuSymmetry;
  difficulty: number;
}
