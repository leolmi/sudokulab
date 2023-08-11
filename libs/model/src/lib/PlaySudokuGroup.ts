import { Dictionary } from '@ngrx/entity';

export class PlaySudokuGroup {
  constructor(sg?: Partial<PlaySudokuGroup>) {
    this.id = '';
    this.cells = [];
    this.availableOnCells = {};
    this.valuesOnCells = {};
    Object.assign(this, sg || {});
  }

  /**
   * identificativo del gruppo
   */
  id: string;
  /**
   * identificativi delle celle appartenenti al gruppo
   */
  cells: string[];
  /**
   * enumera tutte le celle per valore possibile
   * {
   *   v1: { 'c1x.c1y': true, 'c2x.c2y': true, ... , 'cNx.cNy': true },
   *   v2: ....
   * }
   */
  availableOnCells: Dictionary<Dictionary<boolean>>;
  /**
   * Valori per cella del gruppo
   * { v1: cid1..cidN, v2:.... }
   */
  valuesOnCells: Dictionary<number>;
}
