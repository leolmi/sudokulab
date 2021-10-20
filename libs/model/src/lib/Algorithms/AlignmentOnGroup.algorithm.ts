import {
  addLine,
  Algorithm,
  AlgorithmResult,
  AlgorithmType,
  getValuesAlignment,
  PlaySudoku,
  PlaySudokuCellAlignment
} from '@sudokulab/model';
import {
  forEach as _forEach,
  includes as _includes,
  intersection as _intersection,
  keys as _keys,
  remove as _remove
} from 'lodash';
import { Dictionary } from '@ngrx/entity';

export const ALIGNMENT_ON_GROUP_ALGORITHM = 'AlignmentOnGroup';

/**
 * ALGORITMO
 * allineamento nel gruppo:
 *
 * quando un possibile valore è presente in un allineamento in un gruppo,
 * può essere escluso dagli altri gruppi intersecanti
 */
export class AlignmentOnGroupAlgorithm extends Algorithm {
  id = ALIGNMENT_ON_GROUP_ALGORITHM;
  factor = '+15';
  name = 'Alignment on group';
  icon = 'padding';
  type = AlgorithmType.support;
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    const cells: Dictionary<boolean> = {};
    let applied = false;
    let description = '';
    _forEach(sdk.groups, (g) => {
      // ricerca i valori che sono presenti solo in celle allineate
      _forEach(g?.availableOnCells||{}, (cls, v) => {
        const cids = _keys(cls);
        if (getValuesAlignment(cids, sdk?.sudoku?.rank) !== PlaySudokuCellAlignment.none) {
          // ricerca i gruppi comuni a tutte le celle allineate
          const groups = _intersection(...cids.map(id => sdk.groupsForCell[id]));
          // rimuove dai valori possibili per le celle dei gruppi comuni il valore dell'allineamento
          groups.forEach(gid => {
            sdk.groups[gid]?.cells.forEach(cid => {
              const removed = _remove(sdk.cells[cid]?.availables||[], av => !_includes(cids, cid) && av === v);
              if (removed.length > 0) {
                description = addLine(description, `On cell "${cid}" the possible values [${removed.join(',')}] have been removed`);
                applied = true;
              }
            });
          });
        }
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
