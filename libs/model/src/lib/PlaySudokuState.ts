export class PlaySudokuState {
  constructor(s?: Partial<PlaySudokuState>) {
    this.fixedCount = 0;
    this.valuesCount = 0;
    this.percent = 0.0;
    this.error = '';
    this.complete = false;
    Object.assign(this, s || {});
  }
  fixedCount: number;
  valuesCount: number;
  percent: number;
  error: string;
  complete: boolean;
}
