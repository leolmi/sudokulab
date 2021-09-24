import { MessageType, SudokuMessage } from '@sudokulab/model';

export interface Facade {
  name: string;
  raiseMessage(message: SudokuMessage): void;
}
