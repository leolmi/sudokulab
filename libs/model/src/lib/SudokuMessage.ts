import { MessageType } from './enums';

export class SudokuMessage {
  constructor(m?: Partial<SudokuMessage>) {
    this.type = MessageType.info;
    this.duration = 3000;
    Object.assign(this, m || {});
  }
  message?: string;
  type: MessageType;
  action?: string;
  actionCode?: string;
  duration: number;
  data?: any;
}
