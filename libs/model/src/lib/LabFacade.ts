import {BehaviorSubject, Observable} from 'rxjs';
import {PlaySudoku, PlaySudokuOptions, SchemasOptions, SolveStepResult, SudokuMessage} from '@sudokulab/model';
import {Facade} from './Facade';
import {Dictionary} from '@ngrx/entity';

export abstract class LabFacade implements Facade {
  name = 'lab';
  abstract selectActiveSudoku$: Observable<PlaySudoku|undefined>;
  abstract selectSelectedSudoku$: Observable<PlaySudoku|undefined>;
  abstract selectActiveCell$: Observable<string>;
  abstract selectSchemasOptions$: Observable<SchemasOptions>;
  abstract selectStepInfos$: Observable<SolveStepResult[]>;
  abstract selectHighlightCells$: Observable<Dictionary<boolean>>;
  abstract schemaChanged$: BehaviorSubject<any>;

  // abstract loadSudoku(sudoku: Sudoku|undefined, onlyValues?: boolean): void;
  // abstract handleImage(o?: HandleImageOptions): void;
  // abstract checkSchema(o: HandleImageResult): Observable<HandleImageResult>;
  abstract setActiveSudoku(id: number): void;
  abstract setSelectedSudoku(id: number): void;
  abstract openSelectedSudoku(): void;
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
  abstract stepInfo(): void;
  abstract clearStepInfo(): void;
  abstract raiseMessage(message: SudokuMessage): void;
  abstract updateSchemasOptions(changes: Partial<SchemasOptions>): void;
  abstract updatePlayerOptions(changes: Partial<PlaySudokuOptions>): void;
  abstract clesrHighlightCells(): void;
  abstract camera(): void;
  abstract copyAvailableToPencil(): void;
  abstract toggleAvailable(): void;
  abstract togglePopupDetails(): void;
  abstract test(): void;
}
