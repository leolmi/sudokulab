import { SudokuSymmetry } from './enums';
import { AlgorithmResult } from './AlgorithmResult';

export class SudokuInfo {
  constructor(s?: Partial<SudokuInfo>) {
    this.symmetry = SudokuSymmetry.none;
    this.unique = false;
    this.difficulty = '';
    this.algorithms = [];
    Object.assign(this, s || {});
  }
  symmetry: SudokuSymmetry;
  difficulty: string;
  unique: boolean;
  algorithms: AlgorithmResult[];
}
