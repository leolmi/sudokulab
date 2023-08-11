import {Dictionary} from "@ngrx/entity";

export class EditSudokuGroup {
  constructor(g?: Partial<EditSudokuGroup>) {
    this.id = '';
    this.cells = [];
    this.valuesOnCells = {};
    Object.assign(this, g || {});
  }
  id: string;
  cells: string[];
  valuesOnCells: Dictionary<number>;
}
