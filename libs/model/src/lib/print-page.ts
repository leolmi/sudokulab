import { guid } from '../generic.helper';
import { Dictionary } from './types';
import { Type } from '@angular/core';
import { Sudoku } from './sudoku';


export class PrintPage {
  constructor(p?: Partial<PrintPage>) {
    this.id = guid();
    Object.assign(<any>this, p || {});
    this.schemas = p?.schemas||{};
  }

  id: string;
  schemas: Dictionary<string>;
}

export class PrintPageEx extends PrintPage {
  constructor(p?: Partial<PrintPageEx>) {
    super(p);

    this.sudokus = p?.sudokus||{};
  }

  sudokus: Dictionary<Sudoku>;
}
