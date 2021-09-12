import {EditSudokuCell} from "./EditSudokuCell";

export class EditSudokuGroup {
  constructor(g?: Partial<EditSudokuGroup>) {
    this.id = '';
    this.cells = [];
    Object.assign(this, g || {});
  }
  id: string;
  cells: EditSudokuCell[];
}
