import {InjectionToken} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {GeneratorAction, GeneratorWorkingInfo} from "../generator.model";
import {Sudoku} from "../Sudoku";
import {SudokuData} from "./sudoku-data";
import {PlaySudokuOptions} from "../PlaySudokuOptions";
import {GeneratorDataManager} from "../../generator-data-manager";

export const DEFAULT_GENERATOR_OPITIONS: Partial<PlaySudokuOptions> = {
  showAvailables: true,
  fixedValues: true,
  acceptX: true,
  characters: { x:'?' },
  inputProxy: { '?':'x','0':'x' }
}

export class GeneratorData extends SudokuData<GeneratorAction> {
  constructor() {
    super({
      sudoku: new Sudoku(),
      options: new PlaySudokuOptions(DEFAULT_GENERATOR_OPITIONS)
    });
    this.running$ = new BehaviorSubject<boolean>(false);
    this.stopping$ = new BehaviorSubject<boolean>(false);
    this.userStopping$ = new BehaviorSubject<boolean>(false);
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);
    this.schema$ = new BehaviorSubject<Sudoku|null>(null);
    this.workingInfo$ = new BehaviorSubject<GeneratorWorkingInfo>({});
    this.workingSchema$ = new BehaviorSubject<Sudoku | undefined>(undefined);
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
   * azione utente di stop
   */
  userStopping$: BehaviorSubject<boolean>;
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
  /**
   * schema in lavorazione
   */
  workingSchema$: BehaviorSubject<Sudoku|undefined>;
}

export const GENERATOR_DATA = new InjectionToken<{}>('GENERATOR_DATA');
