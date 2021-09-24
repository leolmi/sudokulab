export class PlaySudokuOptions {
  constructor(o?: Partial<PlaySudokuOptions>) {
    this.usePencil = true;
    this.maxSplitSchema = 500;
    this.excludeTryAlgorithm = false;
    Object.assign(this, o || {});
  }
  usePencil: boolean;
  maxSplitSchema: number;
  excludeTryAlgorithm: boolean;
}
