import {
  Algorithm,
  AlgorithmResult,
  AlgorithmResultLine,
  AlgorithmType,
  checkAvailables,
  getUserCoord,
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
import {Dictionary} from '@ngrx/entity';
import {isValue} from '../../global.helper';

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
    const descLines: AlgorithmResultLine[] = [];
    _forEach(sdk.groups, (g) => {
      // ricerca i valori che sono presenti solo in celle allineate
      _forEach(g?.availableOnCells||{}, (cls, v) => {
        const cids = _keys(cls);
        if (getValuesAlignment(cids, sdk?.sudoku?.rank) !== PlaySudokuCellAlignment.none) {
          // ricerca i gruppi comuni a tutte le celle allineate
          const groups = _intersection(...cids.map(id => sdk.groupsForCell[id]));
          // rimuove dai valori possibili per le celle dei gruppi comuni il valore dell'allineamento
          groups.forEach(gid =>
            sdk.groups[gid]?.cells
              .filter(cid => !isValue(sdk.cells[cid]?.value))
              .forEach(cid => {
                const removed = _remove(sdk.cells[cid]?.availables || [], av => !_includes(cids, cid) && av === v);
                if (removed.length > 0) {
                  applied = true;
                  descLines.push(new AlgorithmResultLine({
                    cell: cid,
                    description: `On cell ${getUserCoord(cid)} the possible values [${removed.join(',')}] have been removed`
                  }));
                }
              }));
        }
      });
    });

    if (applied) checkAvailables(sdk);

    return new AlgorithmResult({
      algorithm: this.id,
      applied,
      descLines,
      cells: _keys(cells)
    });
  }
}
