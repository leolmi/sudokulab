import {BehaviorSubject, Observable} from "rxjs";
import { MessageType, PlaySudoku, Sudoku, SudokulabPage, SudokuMessage } from '@sudokulab/model';
import {Facade} from "./Facade";

export abstract class LabFacade implements Facade {
  name = 'lab';
  abstract selectActiveSudoku$: Observable<PlaySudoku|undefined>;
  abstract selectActiveCell$: Observable<string>;

  abstract loadSudoku(sudoku: Sudoku): void;
  abstract setActiveSudoku(id: string): void;
  abstract setActiveCell(id: string): void;
  abstract applyAlgorithm(algorithm: string): void;
  abstract solveStep(): void;
  abstract solve(): void;
  abstract analyze(): void;
  abstract setValue(value: string): void;
  abstract move(direction: string): void;
  abstract clear(): void;
  abstract download(): void;
  abstract upload(): void;
  abstract raiseMessage(message: SudokuMessage): void;
}
