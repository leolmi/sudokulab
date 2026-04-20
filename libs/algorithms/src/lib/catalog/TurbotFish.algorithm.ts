import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  findGroup,
  getAllGroups,
  getByVisibles,
  getGroupCells,
  groupCoord,
  onValuesMap,
  SudokuCell
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';
import { intersection as _intersection, reduce as _reduce, remove as _remove, uniq as _uniq } from 'lodash';

export const TURBOTFISH_ALGORITHM = 'TurbotFish';

/**
 * ALGORITMO Turbot Fish (precedentemente "Chains")
 *
 * Cerca una struttura a 3 gruppi in cui un valore V ha:
 * - in due gruppi (g1, g3) esattamente 2 posizioni ciascuno
 * - in un gruppo di raccordo (g2) un'ulteriore coppia di celle che lega g1 a g3
 *
 * La catena permette di escludere V dalle celle esterne che "vedono"
 * contemporaneamente le estremità di g1 e g3.
 *
 * Casi particolari noti: Skyscraper, Two-String Kite, Empty Rectangle.
 */
export class TurbotFishAlgorithm extends Algorithm {
  id = TURBOTFISH_ALGORITHM;
  priority = 16;
  // più difficile da individuare quando restano molti candidati
  factor = '+200+(NEP*80)';
  name = 'Turbot Fish';
  icon = 'share';
  type = AlgorithmType.support;
  title = `Quando un valore ha coppie di posizioni in tre gruppi legati tra loro (due estremi + raccordo), è possibile escluderlo dalle celle esterne che vedono entrambe le estremità`;
  description = `Discretamente complesso da capire ed applicare, anch'esso non risolve un valore di una cella ma contribuisce con i precedenti`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      findGroup(cells, (g1cells, g1) =>
        onValuesMap(g1cells, (v1, ids1) => {
          if (ids1.length === 2) {
            return !!getAllGroups(cells, ids1).find(g2 => {
              const g2cells = getGroupCells(cells, g2);
              return onValuesMap(g2cells, (v2, ids2) => {
                if (v2 === v1 && ids2.length === 2 && g2.id !== g1.id) {
                  return !!getAllGroups(cells, ids2).find(g3 => {
                    const g3cells = getGroupCells(cells, g3);
                    return onValuesMap(g3cells, (v3, ids3) => {
                      if (v3 === v1 && ids3.length === 2 && g3.id !== g2.id && g3.id !== g1.id && _intersection(ids3, ids1).length === 0) {
                        const externals = _uniq(ids1.concat(ids3));
                        const all = _uniq(externals.concat(ids2));
                        const all_map: any = _reduce(all, (x, id) => ({ ...x, [id]: true }), {});
                        ids2.forEach(k2 => _remove(externals, k12 => k12 === k2));
                        const groups = getAllGroups(cells, externals, true);
                        if (groups.length < 1) {
                          return !!getByVisibles(cells, externals)
                            .filter(c => !all_map[c.id])
                            .find(c => {
                              onRemoved(c, v1, (removed) => {
                                res.applied = true;
                                res.highlights = getHighlights(c, all, [g1, g2, g3]);
                                res.descLines = getSingleResultLine(c,
                                  `Found ${this.name} on ${groupCoord(g1)},${groupCoord(g2)},${groupCoord(g3)} with value "${v1}", so on cell ${c.coord} the possible values [${removed.join(',')}] have been removed`);
                              });
                              return res.applied;
                            });
                        }
                      }
                      return res.applied;
                    });
                  });
                }
                return res.applied;
              });
            })
          }
          return res.applied;
        }));
    });
}

// registra l'algoritmo
registerAlgorithm(new TurbotFishAlgorithm());
