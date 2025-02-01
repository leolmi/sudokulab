import {
  forEach as _forEach,
  includes as _includes,
  intersection as _intersection,
  keys as _keys,
  remove as _remove
} from 'lodash';
import {isValue} from '../../global.helper';
import {Algorithm} from "../Algorithm";
import {AlgorithmType, PlaySudokuCellAlignment} from "../enums";
import {PlaySudoku} from "../PlaySudoku";
import {AlgorithmResult, AlgorithmResultLine} from "../AlgorithmResult";
import {getUserCoord, getValuesAlignment} from "../../sudoku.helper";
import {applyAlgorithm} from "./algorithms.common";

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
  title = 'quando alcune celle all\'interno di un gruppo sono le uniche a poter contenere un determinato valore e generano un allineamento che coinvolge altri gruppi, in questi secondi è possibile escludere quel valore da quelli possibili';
  description = 'Poco più complesso del precedente, anche questo non risolve un valore di una cella ma contribuisce con i precedenti';
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    return applyAlgorithm(this, sdk, (o) => {
      _forEach(sdk.groups, (g) => {
        // ricerca i valori che sono presenti solo in celle allineate
        _forEach(g?.availableOnCells || {}, (cls, v) => {
          // cids = identificativi delle celle con valore "v" allineato
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
                    o.applied = true;
                    o.descLines.push(new AlgorithmResultLine({
                      cell: cid,
                      others: cids,
                      description: `On cell ${getUserCoord(cid)} the possible values [${removed.join(',')}] have been removed`
                    }));
                  }
                }));
          }
        });
      });
    });

  }
}
