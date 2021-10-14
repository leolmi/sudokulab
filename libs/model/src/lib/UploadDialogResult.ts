import { Sudoku } from './Sudoku';

export class UploadDialogResult {
  constructor(r?: Partial<UploadDialogResult>) {
    this.onlyValues = false;
    this.editOnGrid = false;
    Object.assign(this, r || {});
  }
  sdk?: Sudoku;
  image?: string;
  onlyValues: boolean;
  editOnGrid: boolean;
}
