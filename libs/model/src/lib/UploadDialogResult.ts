import { Sudoku } from './Sudoku';

export class UploadDialogResult {
  constructor(r?: Partial<UploadDialogResult>) {
    this.onlyValues = false;
    Object.assign(this, r || {});
  }
  sdk?: Sudoku;
  image?: string;
  onlyValues: boolean;
}
