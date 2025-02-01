import {SudokuGroupType} from "./enums";

/**
 * Informazioni di cella
 */
export class CellInfo {
  constructor(public col: number,
              public row: number,
              public sqr: number,
              public id: string) {
  }
}

/**
 * Informazioni di gruppo
 */
export class GroupInfo {
  constructor(public type: SudokuGroupType,
              public pos: number,
              public id: string) {
  }
}
