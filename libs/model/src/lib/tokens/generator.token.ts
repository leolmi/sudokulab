import {InjectionToken} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {GeneratorAction, GeneratorWorkingInfo} from "../generator.model";
import {Sudoku} from "../Sudoku";
import {SudokuData} from "./sudoku-data";
import {PlaySudokuOptions} from "../PlaySudokuOptions";
import {GeneratorDataManager} from "../../generator-data-manager";

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
    this.stopping$ = new BehaviorSubject<boolean>(false);
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);
    this.schema$ = new BehaviorSubject<Sudoku|null>(null);
    this.workingInfo$ = new BehaviorSubject<GeneratorWorkingInfo>({});
  }
  manager?: GeneratorDataManager;
  /**
   * stato running del generatore
   */
  running$: BehaviorSubject<boolean>;
  /**
   * stato stopping del generatore
   */
  stopping$: BehaviorSubject<boolean>;
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
