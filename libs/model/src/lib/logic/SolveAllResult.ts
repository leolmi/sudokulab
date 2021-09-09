import { SudokuSolution } from '../SudokuSolution';

export class SolveAllResult {
  constructor(public solutions: SudokuSolution[]) {
    const oks = solutions.filter(s => s.sdk.state.complete && !s.sdk.state.error);
    this.unique = (oks.length === 1) ? oks[0] : undefined;
    this.multiple = (oks.length > 1) ? oks : undefined;
  }

  unique: SudokuSolution | undefined;
  multiple: SudokuSolution[] | undefined;
}
