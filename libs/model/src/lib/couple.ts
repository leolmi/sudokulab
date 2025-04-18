import { SudokuCell } from './sudoku-cell';
import { SudokuGroup } from './sudoku-group';

export class Couple {
  constructor(c?: Partial<Couple>) {
    Object.assign(<any>this, c || {});
    this.values = c?.values||[];
    this.cell1 = new SudokuCell(c?.cell1);
    this.cell2 = new SudokuCell(c?.cell2);
    this.group = new SudokuGroup(c?.group);
  }

  cell1: SudokuCell;
  cell2: SudokuCell;
  values: string[];
  group: SudokuGroup;
}
