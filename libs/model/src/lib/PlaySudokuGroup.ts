import { Dictionary } from '@ngrx/entity';

export class PlaySudokuGroup {
  constructor(sg?: Partial<PlaySudokuGroup>) {
    this.id = '';
    this.cells = [];
    this.availableOnCells = {};
    Object.assign(this, sg || {});
  }
  // identificativo del gruppo
  id: string;
  // identificativi delle celle appartenenti al gruppo
  cells: string[];
  // enumera tutte le celle per valore possibile
  // {
  //    v1: { 'c1x.c1y': true, 'c2x.c2y': true, ... , 'cNx.cNy': true },
  //    v2: ....
  // }
  availableOnCells: Dictionary<Dictionary<boolean>>;
}
