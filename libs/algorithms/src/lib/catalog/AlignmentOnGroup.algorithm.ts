import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType, cellCoord,
  findCommonGroups,
  findGroup,
  getGroupCells, groupCoord,
  isTheSameGroup,
  onCell,
  onValuesMap,
  SudokuCell,
  SudokuGroup
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';

export const ALIGNMENT_ON_GROUP_ALGORITHM = 'AlignmentOnGroup';

/**
 * ALGORITMO
 * allineamento nel gruppo
 *
 * quando un possibile valore è presente in un allineamento in un gruppo,
 * può essere escluso dagli altri gruppi intersecanti
 *
 * fattore: +15
 */
export class AlignmentOnGroupAlgorithm extends Algorithm {
  id = ALIGNMENT_ON_GROUP_ALGORITHM;
  priority = 3;
  factor = '+15';
  name = 'Alignment on group';
  icon = 'padding';
  type = AlgorithmType.support;
  title = `quando alcune celle all'interno di un gruppo sono le uniche a poter contenere un determinato valore e generano un allineamento che coinvolge altri gruppi, in questi secondi è possibile escludere quel valore da quelli possibili`;
  description = 'Poco più complesso del precedente, anche questo non risolve un valore di una cella ma contribuisce con i precedenti';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      findGroup(cells, (gcells, g) => {
        return onValuesMap(gcells, (v, ids, vm) => {
          // se le celle che possono contenere il valore sviluppano un allineamento nel gruppo *g*
          // tutte le altre celle allineate nel gruppo *cg* possono escludere il valore
          return findCommonGroups(ids, (cgs: SudokuGroup[]) => {
            return !!cgs.find(cg => {
              // se il gruppo non è lo stesso che genera allineamento
              // nelle altre celle posso eliminare il valore allineato
              if (!isTheSameGroup(cg, g)) {
                const cgcells = getGroupCells(cells, cg);
                const cell = cgcells.find(c => !ids.includes(c.id) && c.available.includes(v));
                if (cell) {
                  onCell(cells, cell, (xc) => {
                    onRemoved(xc, v, (removed) => {
                      res.applied = true;
                      res.highlights = getHighlights(xc, ids, [g, cg]);
                      res.descLines = getSingleResultLine(xc,
                        `On group ${groupCoord(g)} the values [${removed.join(',')}] are aligned so, on group ${groupCoord(cg)} in ${xc.coord} this values have been removed from available`);
                    });
                  });
                }
              }
              return res.applied;
            });
          });
        })
      })
    });
}

// registra l'algoritmo
registerAlgorithm(new AlignmentOnGroupAlgorithm());
