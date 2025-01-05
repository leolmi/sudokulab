import { Dictionary } from '@ngrx/entity';

export class PlaySudokuGroup {
  constructor(sg?: Partial<PlaySudokuGroup>) {
    this.id = '';
    this.cells = [];
    this.availableOnCells = {};
    this.availableCounter = {};
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
   * Valori possibili per cella del gruppo
   * serve a enumerare le stesse collezioni di valori possibili per cella del gruppo
   * {
   *   "v1,v2,...": { 'c1x.c1y': true, 'c2x.c2y': true, ... , 'cNx.cNy': true },
   *   "v2,v4,v6,...": ....
   * }
   */
  availableCounter: Dictionary<Dictionary<boolean>>;
  /**
   * Valori per cella del gruppo
   * { v1: counterV1, v2:counterV2, ... }
   */
  valuesOnCells: Dictionary<number>;
}
