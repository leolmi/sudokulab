import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  findGroup,
  getCellGroupPos, getCoord,
  getGroupCells,
  GroupType,
  isTheSameGroup,
  onValuesMap,
  SudokuCell,
  SudokuGroup
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';
import { intersection as _intersection } from 'lodash';


export const XWINGS_ALGORITHM = 'XWings';

/**
 * ALGORITMO X-Wings
 *
 * Quando due righe (o due colonne) contengono solamente due posizioni possibili per un dato numero e
 * quelle due posizioni si trovano nelle stesse due colonne (o due righe), si può eliminare quel
 * numero da tutte le altre posizioni ancora possibili delle due colonne (o due righe).
 *
 * fattore: +150
 */
export class XWingsAlgorithm extends Algorithm {
  id = XWINGS_ALGORITHM;
  priority = 6;
  factor = '+150';
  name = 'X-Wings';
  icon = 'grid_view';
  type = AlgorithmType.support;
  title = `Quando due righe (o due colonne) contengono solamente due posizioni possibili per un dato numero e
  quelle due posizioni si trovano nelle stesse due colonne (o due righe), si può eliminare quel numero da tutte le altre
  posizioni ancora possibili delle due colonne (o due righe).`;
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori
  possibili dalle celle interessate`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      // ricerca nei gruppi righe e colonne
      findGroup(cells, (g1cells, g1) => {
        if (g1.type === GroupType.column || g1.type === GroupType.row) {
          return onValuesMap(g1cells, (v1, ids1) => {
            // se nel gruppo solo due celle possono contenere il valore `v`
            if (ids1.length === 2) {
              // ricerca il secondo gruppo diverso ma dello stesso tipo con la stessa coppia di valori
              return !!findGroup(cells, (g2cells, g2) => {
                if (!isTheSameGroup(g1, g2) && g2.type === g1.type) {
                  return onValuesMap(g2cells, (v2, ids2) => {
                    if (v2 === v1 && ids2.length === 2) {
                      const cids = ids1.concat(ids2);
                      return findOrtogonal(ids1, ids2, g1.type, (og) => {
                        // ricerca nel gruppo ortogonale valori da escludere nelle celle che non fanno
                        // parte della selezione primaria (ids)
                        return !!getGroupCells(cells, og).find(oc => {
                          if (!cids.includes(oc.id)) {
                            onRemoved(oc, v1, (removed) => {
                              res.applied = true;
                              res.highlights = getHighlights(oc, cids);
                              res.descLines = getSingleResultLine(oc,
                                `Found ${this.name} for value "${v1}" on cells ${cids.map(cid => getCoord(cid)).join(',')}, so on cell ${oc.coord} the possible values [${removed.join(',')}] have been removed`);
                            });
                          }
                          return res.applied;
                        });
                      });
                    }
                    return res.applied;
                  });
                }
                return res.applied;
              });
            }
            return res.applied;
          })
        }
        return res.applied;
      })
    })
}


/**
 * restituisce se esistono i gruppi passanti per le celle `ids` e di tipo ortogonale a `type`
 * @param ids1
 * @param ids2
 * @param type
 * @param handler
 */
const findOrtogonal = (ids1: string[], ids2: string[], type: GroupType, handler: (g: SudokuGroup) => boolean): boolean => {
  const otype = (type === GroupType.row) ? GroupType.column : GroupType.row;
  const ps1 = ids1.map(id => getCellGroupPos(id, otype));
  const ps2 = ids2.map(id => getCellGroupPos(id, otype));
  // le celle devono essere corrispondenti
  if (_intersection(ps1, ps2).length === 2) {
    return !![
      new SudokuGroup({ pos: ps1[0], type: otype }),
      new SudokuGroup({ pos: ps1[1], type: otype }),
    ].find(g => handler(g));
  }
  return false;
}

// registra l'algoritmo
registerAlgorithm(new XWingsAlgorithm());
