import { Dictionary } from '@ngrx/entity';

export class PlaySudokuGroup {
  constructor(sg?: Partial<PlaySudokuGroup>) {
    this.id = '';
    this.cells = [];
    this.availableOnCells = {};
    Object.assign(this, sg || {});
  }
  id: string;
  cells: string[];
  availableOnCells: Dictionary<Dictionary<boolean>>;
}
