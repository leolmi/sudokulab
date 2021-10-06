import { SudokuSolution } from '../SudokuSolution';

export class SolveAllResult {
  constructor(public solutions: SudokuSolution[], start: number, reason: string) {
    this.elapsed = performance.now() - start;
    this.reason = reason;
    const oks = solutions.filter(s => s.sdk.state.complete && !s.sdk.state.error);
    this.unique = (oks.length === 1) ? oks[0] : undefined;
    this.multiple = (oks.length > 1) ? oks : undefined;
  }

  elapsed: number;
  reason: string;
  unique: SudokuSolution | undefined;
  multiple: SudokuSolution[] | undefined;
}
