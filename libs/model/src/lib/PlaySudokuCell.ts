export class PlaySudokuCell {
  constructor(c?: Partial<PlaySudokuCell>) {
    this.id = '';
    this.value = '';
    this.availables = [];
    this.fixed = false;
    Object.assign(this, c || {});
  }
  id: string;
  fixed: boolean;
  value: string;
  availables: string[];
}
