import { Facade, SudokuMessage } from '@sudokulab/model';

export abstract class OptionsFacade implements Facade {
  name = 'options';
  abstract raiseMessage(message: SudokuMessage): void;
  abstract reset(): void;
}
