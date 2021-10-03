import { Facade, SudokuMessage } from '@sudokulab/model';

export abstract class HelpFacade implements Facade {
  name = 'help';
  abstract raiseMessage(message: SudokuMessage): void;
}
