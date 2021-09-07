export class PlaySudokuOptions {
  constructor(o?: Partial<PlaySudokuOptions>) {
    this.showAvailables = true;
    Object.assign(this, o || {});
  }
  showAvailables: boolean;
}
