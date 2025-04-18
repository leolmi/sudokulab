import { Cell } from './cell';
import { SudokuGroup } from './sudoku-group';
import { Dictionary } from './types';
import { SudokuLabel } from './sudoku-label';

export class Highlights {
  constructor(h?: Partial<Highlights>) {
    Object.assign(<any>this, h || {});
    this.cell = h?.cell||{};
    this.secondaryCell = h?.secondaryCell||{};
    this.cellValue = h?.cellValue||{};
    this.groups = (h?.groups||[]).map(g => new SudokuGroup(g));
    this.paths = h?.paths||[];
    this.code = h?.code||'';
    this.label = h?.label;
  }

  cell: Dictionary<boolean>;
  secondaryCell: Dictionary<boolean>;
  cellValue: Dictionary<string>;
  paths: Cell[][];
  groups: SudokuGroup[];
  label?: SudokuLabel;

  /**
   * codice hl (highlight-string)
   */
  code: string;
}
