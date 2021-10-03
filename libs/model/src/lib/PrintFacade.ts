import { Facade, SudokuMessage } from '@sudokulab/model';

export abstract class PrintFacade implements Facade {
  name = 'print';
  abstract raiseMessage(message: SudokuMessage): void;
}
