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
        fixedValues: true,
        acceptX: true,
        characters: { x:'?' },
        inputProxy: { '?':'x','0':'x' }
      })
    });
    this.running$ = new BehaviorSubject<boolean>(false);
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);
    this.schema$ = new BehaviorSubject<Sudoku|null>(null);
    this.workingInfo$ = new BehaviorSubject<GeneratorWorkingInfo>({});
  }
  /**
   * stato running del generatore
   */
  running$: BehaviorSubject<boolean>;
  /**
   * elenco degli schemi generati
   */
  schemas$: BehaviorSubject<Sudoku[]>;
  /**
   * schema corrente tra quelli generati
   */
  schema$: BehaviorSubject<Sudoku|null>;
  /**
   * informazioni di stato sulla generazione
   */
  workingInfo$: BehaviorSubject<GeneratorWorkingInfo>;
}

export const GENERATOR_DATA = new InjectionToken<{}>('GENERATOR_DATA');
