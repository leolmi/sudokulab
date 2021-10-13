import { Observable } from 'rxjs';
import { EditSudoku, EditSudokuOptions, Sudoku, SudokuMessage, WorkingInfo } from '@sudokulab/model';
import { Facade } from './Facade';

export abstract class GeneratorFacade implements Facade {
  name = 'generator';
  abstract selectActiveSudoku$: Observable<EditSudoku|undefined>;
  abstract selectActiveCell$: Observable<string>;
  abstract selectGeneratorIsRunning$: Observable<boolean>;
  abstract selectGeneratorIsStopping$: Observable<boolean>;
  abstract selectGeneratorSchemas$: Observable<Sudoku[]>;
  abstract selectGeneratorWorkingInfo$: Observable<WorkingInfo|undefined>;

  abstract setActiveCell(id: string): void;
  abstract setValue(value: string): void;
  abstract move(direction: string): void;
  abstract updateGeneratorOptions(changes: EditSudokuOptions): void;
  abstract addSchema(schema: Sudoku): void;
  abstract openInLab(schema: Sudoku): void;
  abstract setWorkingInfo(info: WorkingInfo): void;

  abstract run(): void;
  abstract stop(): void;
  abstract end(): void;
  abstract download(): void;
  abstract downloadAll(): void;
  abstract removeAll(): void;
  abstract upload(): void;
  abstract clear(): void;
  abstract generate(): void;
  abstract raiseMessage(message: SudokuMessage): void;
}
