import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, getCoord, SudokuCell } from '@olmi/model';
import {
  applyAlgorithm,
  getHighlights,
  getSingleResultLine,
  isTheSameValueTypeOnGroups,
  onCouples,
  onOthers,
  onRemoved,
  registerAlgorithm
} from '../algorithms.common';

export const YWINGS_ALGORITHM = 'YWings';

/**
 * ALGORITMO Y-Wings
 *
 * fattore: +190
 */
export class YWingsAlgorithm extends Algorithm {
  id = YWINGS_ALGORITHM;
  priority = 7;
  factor = '+190';
  name = 'Y-Wings';
  icon = 'widgets';
  type = AlgorithmType.support;
  title = 'Y-Wings';
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      // ricerca nei gruppi righe e colonne
      onCouples(res, cells, (info1) => {
        // ricerca il secondo gruppo diverso ma dello stesso tipo con la stessa coppia di valori
        onCouples(res, cells, (info2) => {
          // se il valore della coppia è lo stesso può verificare l'algoritmo
          // su ogni cella che condivide uno dei valori della coppia trasversale
          // e vede cotemporaneamente le due celle
          onOthers(res, cells, info1, info2, (oc: SudokuCell, v: string) => {
            const cids = [...info1.ids, ...info2.ids];
            onRemoved(oc, v, (removed) => {
              res.applied = true;
              res.highlights = getHighlights(oc, cids);
              res.descLines = getSingleResultLine(oc,
                `Found ${this.name} on cells ${cids.map(cid => getCoord(cid)).join(',')} with value "${info1.value}", so on cell ${oc.coord} the possible values [${removed.join(',')}] have been removed`);
            });
          });
          return res.applied;
        },
        (info2) => isTheSameValueTypeOnGroups(info1, info2));
        return res.applied;
      });
    })
}

// registra l'algoritmo
registerAlgorithm(new YWingsAlgorithm());
