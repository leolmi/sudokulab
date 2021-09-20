export class EditSudokuCell {
  constructor(c?: Partial<EditSudokuCell>) {
    this.id = '';
    this.position = 0;
    this.value = '';
    this.fixed = false;
    this.availables = [];
    Object.assign(this, c || {});
  }
  id: string;
  position: number;
  fixed: boolean;
  value: string;
  availables: string[];
}
