import { Cell } from './cell';
import { SudokuGroup } from './sudoku-group';
import { Dictionary } from './types';
import { SudokuLabel } from './sudoku-label';

/**
 * Valore di una evidenziazione: `true` = stile/colore di default,
 * `string` = colore custom (es. "red", "#4064ff") interpretato come colore puro,
 * la trasparenza è applicata dal rendering.
 */
export type HighlightValue = boolean | string;

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

  cell: Dictionary<HighlightValue>;
  secondaryCell: Dictionary<HighlightValue>;
  cellValue: Dictionary<HighlightValue>;
  paths: Cell[][];
  groups: SudokuGroup[];
  label?: SudokuLabel;

  /**
   * codice hl (highlight-string)
   */
  code: string;
}
