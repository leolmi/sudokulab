import { Sudoku } from './Sudoku';

export class UploadDialogResult {
  constructor(public sdk: Sudoku,
              public onlyValues: boolean) {
  }
}
