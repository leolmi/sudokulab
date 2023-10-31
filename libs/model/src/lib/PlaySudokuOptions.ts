import { SUDOKU_DEFAULT_MAXSPLIT } from './consts';
import {EditSudokuEndGenerationMode, SudokuSymmetry} from "./enums";

export class GeneratorOptions {
  constructor(o?: Partial<GeneratorOptions>) {
    Object.assign(this, o || {});
  }
  fixedCount = 24;
  unique = true;
  symmetry = SudokuSymmetry.horizontal;
  excludeTryAlgorithm = true;
  generationEndMode = EditSudokuEndGenerationMode.afterN;
  generationEndValue = 1;
  minDiff = 0;
  maxDiff = 1000000;
}

export class PlaySudokuOptions {
  constructor(o?: Partial<PlaySudokuOptions>) {
    this.generator = new GeneratorOptions();
    this.usePencil = false;
    this.showAvailables = false;
    this.maxSplitSchema = SUDOKU_DEFAULT_MAXSPLIT;
    this.excludeTryAlgorithm = false;
    this.showPopupDetails = true;
    this.highlightsDelay = 4000;
    this.fixedValues = false;
    Object.assign(this, o || {});
    this.generator = new GeneratorOptions(this.generator||{});
  }
  usePencil: boolean;
  showAvailables: boolean;
  maxSplitSchema: number;
  excludeTryAlgorithm: boolean;
  showPopupDetails: boolean;
  highlightsDelay: number;
  fixedValues: boolean;

  generator: GeneratorOptions;
}
