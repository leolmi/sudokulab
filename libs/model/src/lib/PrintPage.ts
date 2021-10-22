import { Sudoku } from './Sudoku';
import { guid } from '../global.helper';
import { Dictionary } from '@ngrx/entity';

export class PrintPage {
  constructor(p?: Partial<PrintPage>) {
    this.schema = {};
    Object.assign(this, p || {});
    this.id = guid();
  }
  id: string;
  schema: Dictionary<Sudoku>;
}
