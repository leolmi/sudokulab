import { Facade, PrintData, SudokuMessage } from '@sudokulab/model';

export abstract class PrintFacade implements Facade {
  name = 'print';
  abstract raiseMessage(message: SudokuMessage): void;

  abstract setPrintData(data: PrintData): void;
  abstract print(): void;
}
