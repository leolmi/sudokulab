import {Dictionary} from "@ngrx/entity";
import {SudokuSymmetry} from './enums';
import {AlgorithmResult} from './AlgorithmResult';
import {SudokuSolution} from "./SudokuSolution";

export class SudokuInfo {
  constructor(s?: Partial<SudokuInfo>) {
    this.symmetry = SudokuSymmetry.none;
    this.compiled = false;
    this.unique = false;
    this.useTryAlgorithm = false;
    this.difficulty = '';
    this.algorithms = [];
    this.difficultyMap = {};
    this.difficultyValue = 0;
    this.solutions = [];
    Object.assign(this, s || {});
  }
  symmetry: SudokuSymmetry;
  difficulty: string;
  compiled: boolean;
  unique: boolean;
  useTryAlgorithm: boolean;
  algorithms: AlgorithmResult[];
  difficultyMap: Dictionary<number>;
  difficultyValue: number;
  solutions: SudokuSolution[];
}
