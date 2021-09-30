export class PlaySudokuOptions {
  constructor(o?: Partial<PlaySudokuOptions>) {
    this.usePencil = true;
    this.showAvailables = true;
    this.maxSplitSchema = 500;
    this.excludeTryAlgorithm = false;
    Object.assign(this, o || {});
  }
  usePencil: boolean;
  showAvailables: boolean;
  maxSplitSchema: number;
  excludeTryAlgorithm: boolean;
}
