import {
  Algorithm,
  AlgorithmResult,
  getAlignment,
  PlayAlgorithm,
  PlaySudoku,
  PlaySudokuCellAlignment
} from '@sudokulab/model';
import {
  forEach as _forEach,
  includes as _includes,
  intersection as _intersection,
  reduce as _reduce,
  remove as _remove,
  keys as _keys
} from 'lodash';
import { Dictionary } from '@ngrx/entity';

export const ALIGNMENT_ON_GROUP_ALGORITHM = 'AlignmentOnGroup';

/**
 * ALGORITMO
 * allineamento nel gruppo:
 *
 * quando un possibile valore è presente solo 2 volte in un gruppo e genera un allineamento,
 * può essere escluso dagli altri gruppi intersecanti
 */
export class AlignmentOnGroupAlgorithm extends Algorithm implements PlayAlgorithm {
  constructor(a?: Partial<AlignmentOnGroupAlgorithm>) {
    super(a);
    this.name = 'Alignment on group';
    this.id = ALIGNMENT_ON_GROUP_ALGORITHM;
    this.factor = 1.5;
  }

  id: string;
  name: string;
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    const cells: Dictionary<boolean> = {};
    let applied = false;
    _forEach(sdk.groups, (g) => {
      // ricerca i valori che sono presenti solo in due celle allineate
      const couples: Dictionary<string[]> = _reduce(g?.availableOnCells || {}, (res, cids, k) => {
        const ids = _keys(cids||{});
        if (ids.length === 2 && getAlignment(ids[0], ids[1]) !== PlaySudokuCellAlignment.none) res[k] = ids;
        return res;
      }, <Dictionary<string[]>>{});
      // l'algoritmo è applicato se fra tutte le coppie trovate, almeno una
      // permette di eliminare valori possibili da altre celle
      _forEach(couples,(cp, v) => {
        // considera i gruppi a cui appartengono entrambe le celle
        const groups = _intersection(sdk.groupsForCell[(cp || [])[0]], sdk.groupsForCell[(cp || [])[1]]);
        groups.forEach(g =>
          g?.cells.forEach(c => {
            const removed = _remove(c.availables, av => !_includes(cp, c.id) && av === v);
            if (removed.length > 0) applied = true;
          }));
      });
    });

    return new AlgorithmResult({ applied, cells: _keys(cells) });
  }
}
