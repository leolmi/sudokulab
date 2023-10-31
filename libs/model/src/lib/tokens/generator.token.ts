import {InjectionToken} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {GeneratorAction, GeneratorWorkingInfo} from "../generator.model";
import {Sudoku} from "../Sudoku";
import {SudokuData} from "./sudoku-data";
import {PlaySudokuOptions} from "../PlaySudokuOptions";

export class GeneratorData extends SudokuData<GeneratorAction> {
  constructor() {
    super({
      sudoku: new Sudoku(),
      options: new PlaySudokuOptions({
        showAvailables: true,
        fixedValues: true
      })
    });
    this.running$ = new BehaviorSubject<boolean>(false);
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);
    this.schema$ = new BehaviorSubject<Sudoku|null>(null);
    this.workingInfo$ = new BehaviorSubject<GeneratorWorkingInfo>({});
  }
  running$: BehaviorSubject<boolean>;
  schemas$: BehaviorSubject<Sudoku[]>;
  schema$: BehaviorSubject<Sudoku|null>;
  workingInfo$: BehaviorSubject<GeneratorWorkingInfo>;
}

export const GENERATOR_DATA = new InjectionToken<{}>('GENERATOR_DATA');
