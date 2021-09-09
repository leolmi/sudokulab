import { MessageType } from './enums';

export class SudokuMessage {
  constructor(m?: Partial<SudokuMessage>) {
    this.type = MessageType.info;
    Object.assign(this, m || {});
  }
  message?: string;
  type: MessageType;
}
