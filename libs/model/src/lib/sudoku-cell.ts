import { Cell } from './cell';
import { Pos } from './pos';
import { DEFAULT_AVAILABLES, GroupType } from './consts';
import { cellCoord, cellId, getCellGroupPos } from '../model.helper';
import { ErrorsContainer } from './sudoku-error';

export class SudokuCell extends Pos implements Cell {
  constructor(c?: Partial<SudokuCell>) {
    super(c);
    this.col = c?.col||0;
    this.row = c?.row||0;
    this.available = c?.available||DEFAULT_AVAILABLES;
    this.text = c?.text||'';
    this.isDynamic = !!c?.isDynamic;
    this.isFixed = !!c?.isFixed;

    this.id = c?.id||cellId(this.col, this.row);
    this.coord = c?.coord||cellCoord(this);
    this.error = c?.error;
    this.sqr = getCellGroupPos(this, GroupType.square);
    this.userValues = c?.userValues||[];
    this.userValue = c?.userValue||'';
  }

  id: string;
  col: number;
  row: number;
  sqr: number;
  coord: string;
  error?: ErrorsContainer;
  text: string;
  available: string[];

  userValue: string;
  userValues: string[];

  isDynamic: boolean;
  isFixed: boolean;
}
