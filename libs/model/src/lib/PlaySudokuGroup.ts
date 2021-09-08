import { PlaySudokuCell } from '@sudokulab/model';
import { Dictionary } from '@ngrx/entity';

export class PlaySudokuGroup {
  constructor(sg?: Partial<PlaySudokuGroup>) {
    this.id = '';
    this.cells = [];
    this.couples = [];
    this.availableOnCells = {};
    Object.assign(this, sg || {});
  }
  id: string;
  cells: PlaySudokuCell[];
  availableOnCells: Dictionary<Dictionary<boolean>>;
  couples: PlaySudokuCell[];
}
