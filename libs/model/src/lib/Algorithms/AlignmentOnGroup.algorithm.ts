import {
  addLine,
  Algorithm,
  AlgorithmResult,
  getAlignment, getGroupCouples,
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
export class AlignmentOnGroupAlgorithm extends Algorithm {
  id = ALIGNMENT_ON_GROUP_ALGORITHM;
  name = 'Alignment on group';
  icon = 'padding';
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    const cells: Dictionary<boolean> = {};
    let applied = false;
    let description = '';
    _forEach(sdk.groups, (g) => {
      // ricerca i valori che sono presenti solo in due celle allineate
      const couples = getGroupCouples(g, (ids) => getAlignment(ids[0], ids[1]) !== PlaySudokuCellAlignment.none);
      // l'algoritmo è applicato se fra tutte le coppie trovate, almeno una
      // permette di eliminare valori possibili da altre celle
      _forEach(couples,(cp, v) => {
        // considera i gruppi a cui appartengono entrambe le celle
        const groups = _intersection(sdk.groupsForCell[(cp || [])[0]], sdk.groupsForCell[(cp || [])[1]]);
        groups.forEach(g =>
          g?.cells.forEach(c => {
            const removed = _remove(c.availables, av => !_includes(cp, c.id) && av === v);
            if (removed.length > 0) {
              addLine(description, `On cell "${c.id}" the possible values [${removed.join(',')}] have been removed`);
              applied = true;
            }
          }));
      });
    });

    return new AlgorithmResult({
      algorithm: this.id,
      applied,
      description,
      cells: _keys(cells)
    });
  }
}
