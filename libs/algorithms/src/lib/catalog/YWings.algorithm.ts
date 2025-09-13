import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  getByVisibles,
  getCoords,
  getGroupCells,
  isOnGroup,
  SudokuCell,
  SudokuGroup
} from '@olmi/model';
import {
  applyAlgorithm,
  getHighlights,
  getOthers,
  getSingleResultLine,
  onCellGroups,
  onCouples,
  onRemoved,
  registerAlgorithm
} from '../algorithms.common';
import { intersection as _intersection } from 'lodash';

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
        // verifica che entrambe le celle della coppia possano contenere solo 2 valori
        const couple_cells = info1.gcells.filter(c => info1.ids.includes(c.id));
        if (!couple_cells.find(c => c.available.length !== 2)) {
          // verifica che la coppia trovata sul valore (info1.value)
          // contenga altri due valori diversi.
          // gli altri valori possibili delle 2 celle della coppia
          const o_available = getOthers(couple_cells, info1.value);
          // l'algoritmo vale se gli altri valori sono 2 diversi tra loro e, ovviamente,
          // da quello trovato (info1.value)
          if (o_available.length === 2) {
            // ricerca della terza cella dello y-wing nei gruppi di cui fanno parte
            // le due celle appena trovate (escluso il gruppo comune)
            return !!couple_cells.find((cpc) => {
              return onCellGroups(cells, cpc.id, info1.group.id, (g: SudokuGroup) => {
                return !!getGroupCells(cells, g).find(ogc => {

                  // cerca la cella che può contenere esattamente i due "altri" valori della coppia
                  const ogc_values = ogc.available;
                  const hasValues = _intersection(ogc_values, o_available).length === 2;
                  if (!ogc.text && ogc_values.length === 2 && hasValues && !isOnGroup(ogc, info1.group)) {
                    // ha trovato la terza cella dello Y-Wing (ogc) quindi il gruppo pivot
                    // è quello che vede contemporaneamente questa cella e quella della
                    // coppia iniziale ossia "g".
                    // Adesso puoi considerare alternativamente la coppia di ali (cpc, ogc) ed eliminare
                    // dalle celle che le vedono contemporaneamente il valore comune (wings_value)
                    const wings_value = _intersection(cpc.available, ogc.available)[0];
                    if (wings_value) {
                      const wings_ids = [cpc.id, ogc.id];
                      const cids = [...info1.ids, ogc.id];
                      return !!getByVisibles(cells, wings_ids).find(xc => {
                        // la cella dove rimuovere il valore (wings_value)
                        if (!wings_ids.includes(xc.id)) {
                          onRemoved(xc, wings_value, (removed) => {
                            res.applied = true;
                            res.highlights = getHighlights(xc,);
                            res.descLines = getSingleResultLine(xc,
                              `Found ${this.name} on cells ${getCoords(cids)} with values "${info1.value}"and "${wings_value}", so on cell ${xc.coord} the possible value [${wings_value}] have been removed`);
                          });
                        }
                        return res.applied;
                      });
                    }
                  }
                  return res.applied;
                });
              });
            });
          }
        }
        return res.applied;
      });
    })
}

// registra l'algoritmo
registerAlgorithm(new YWingsAlgorithm());
