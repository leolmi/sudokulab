import {Dictionary} from "@ngrx/entity";
import {SudokuSymmetry} from './enums';
import {AlgorithmResult} from './AlgorithmResult';
import {SudokuSolution} from "./SudokuSolution";
import { SUDOKU_DEFAULT_RANK } from './consts';

export class SudokuInfo {
  constructor(s?: Partial<SudokuInfo>) {
    this.fixedCount = 0;
    this.symmetry = SudokuSymmetry.none;
    this.compiled = false;
    this.sudokulab = false;
    this.unique = false;
    this.useTryAlgorithm = false;
    this.algorithms = [];
    this.difficultyMap = {};
    this.difficultyValue = 0;
    this.solutions = [];
    Object.assign(this, s || {});
    this.rank = s?.rank || SUDOKU_DEFAULT_RANK;
  }
  rank: number;
  fixedCount: number;
  symmetry?: SudokuSymmetry;
  difficulty?: string;
  compiled: boolean;
  unique: boolean;
  useTryAlgorithm: boolean;
  algorithms: AlgorithmResult[];
  difficultyMap: Dictionary<number[]>;
  difficultyValue: number;
  solutions?: SudokuSolution[];
  sudokulab: boolean;
}
