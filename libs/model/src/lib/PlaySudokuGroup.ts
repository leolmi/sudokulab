import { PlaySudokuCell } from '@sudokulab/model';

export class PlaySudokuGroup {
  constructor(sg?: Partial<PlaySudokuGroup>) {
    this.id = '';
    this.cells = [];
    Object.assign(this, sg || {});
  }
  id: string;
  cells: PlaySudokuCell[];
}
