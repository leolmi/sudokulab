import {InjectionToken} from "@angular/core";
import {BehaviorSubject, Subject} from "rxjs";
import {AlgorithmResultLine} from "../AlgorithmResult";
import {BoardAction} from "../board.model";
import {PlaySudokuOptions} from "../PlaySudokuOptions";
import {SudokuData} from "./sudoku-data";
import {Sudoku} from "../Sudoku";
import {BoardDataManager} from "../../board-data-manager";

export class BoardData extends SudokuData<BoardAction> {
  constructor() {
    super({
      sudoku: new Sudoku(),
      options: new PlaySudokuOptions()
    });
    this.info$ = new Subject<AlgorithmResultLine>();
  }
  manager?: BoardDataManager;
  info$: Subject<AlgorithmResultLine>;
}

export const BOARD_DATA = new InjectionToken<{}>('BOARD_DATA');
