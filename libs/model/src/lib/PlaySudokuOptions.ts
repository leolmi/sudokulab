export class PlaySudokuOptions {
  constructor(o?: Partial<PlaySudokuOptions>) {
    this.usePencil = true;
    Object.assign(this, o || {});
  }
  usePencil: boolean;
}
