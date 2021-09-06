export class SudokuOptions {
  constructor(o?: Partial<SudokuOptions>) {
    this.name = '';
    this.locked = false;
    this.editable = false;
    Object.assign(this, o || {});
  }
  name: string;
  locked: boolean;
  editable: boolean;
}
