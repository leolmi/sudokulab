import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  findGroup,
  getAllGroups,
  getByVisibles,
  getGroupCells,
  onValuesMap,
  SudokuCell
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';
import { intersection as _intersection, reduce as _reduce, remove as _remove, uniq as _uniq } from 'lodash';

export const CHAINS_ALGORITHM = 'Chains';

/**
 * ALGORITMO CHAINS
 *
 * rileva relazioni tra tre gruppi:
 * - due dove solo due celle possono ospitare un determinato valore
 * - un terzo (di raccordo) che ospita due delle celle dei primi 2 gruppi
 *
 * fattore: +170
 */
export class ChainsAlgorithm extends Algorithm {
  id = CHAINS_ALGORITHM;
  priority = 9;
  factor = '+170';
  name = 'Chains over groups';
  icon = 'share';
  type = AlgorithmType.support;
  title = `quando coppie di stessi valori coinvivono all'interno di tre gruppi diversi legati per le celle che ospitano tali valori, questi fanno si che sia possibile escludere il valore da celle esterne ai gruppi considerati`;
  description = `Discretamente complesso da capire ed applicare, anch'esso non risolve un valore di una cella ma contribuisce con i precedenti`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      findGroup(cells, (g1cells, g1) =>
        onValuesMap(g1cells, (v1, ids1, vm1) => {
          if (ids1.length === 2) {
            // considera tutti i gruppi diversi dal corrente che hanno
            // lo stesso valore possibile più volte
            // questo è il gruppo di raccordo, quindi non necessariamente deve
            // contenere il valore 2 volte, ma il valore deve essere in due celle diverse uno per gruppo 1 e 3.
            return !!getAllGroups(cells, ids1).find(g2 => {
              const g2cells = getGroupCells(cells, g2);
              // il secondo gruppo compatibile ha anch'esso almeno 2 celle per ospitare il valore "v1"
              return onValuesMap(g2cells, (v2, ids2, vm2) => {
                if (v2 === v1 && ids2.length === 2 && g2.id !== g1.id) {
                  // ricerca adesso il terzo gruppo con le stessa caratteristiche del primo
                  // ossia dove il valore è inseribile in solo 2 celle
                  return !!getAllGroups(cells, ids2).find(g3 => {
                    const g3cells = getGroupCells(cells, g3);
                    return onValuesMap(g3cells, (v3, ids3, vm3) => {
                      if (v3 === v1 && ids3.length === 2 && g3.id !== g2.id && g3.id !== g1.id && _intersection(ids3, ids1).length === 0) {
                        // trovati i 3 gruppi legati tra loro, si ricavano ora le celle esterne
                        // cioè non facenti parte del secondo gruppo
                        const externals = _uniq(ids1.concat(ids3));
                        const all = _uniq(externals.concat(ids2));
                        const all_map: any = _reduce(all, (x, id) => ({ ...x, [id]: true }), {});
                        ids2.forEach(k2 => _remove(externals, k12 => k12 === k2));
                        // se queste celle NON appartengono ad uno stesso gruppo possono portare
                        // all'esclusione di valori nelle intersezioni
                        const groups = getAllGroups(cells, externals, true);
                        if (groups.length < 1) {
                          // determinazione delle celle interessate, ossia quelle che "vedono" contemporaneamente
                          // entrambe le celle e che contengono come valore possibile "v1" (e non fanno parte delle externals_all)
                          return !!getByVisibles(cells, externals)
                            .filter(c => !all_map[c.id])
                            .find(c => {
                              onRemoved(c, v1, (removed) => {
                                res.applied = true;
                                res.highlights = getHighlights(c, all);
                                res.descLines = getSingleResultLine(c,
                                  `On cell ${c.coord} the possible values [${removed.join(',')}] have been removed`);

                                // console.log(`[${this.name}] g1:`, g1, '\n\tg2', g2, '\n\tg3', g3, '\n\tvalue', v1, '\n\tids 1', ids1, '\n\tids 2', ids2, '\n\tids3', ids3);
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
registerAlgorithm(new ChainsAlgorithm());
