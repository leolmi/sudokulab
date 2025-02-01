import { Algorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import {AlgorithmResult, AlgorithmResultLine} from '../AlgorithmResult';
import { cloneDeep as _clone, minBy as _minBy, values as _values } from 'lodash';
import { checkAvailable } from '../logic';
import { PlaySudokuCell } from '../PlaySudokuCell';
import { AlgorithmType } from '../enums';
import {getUserCoord} from "../../sudoku.helper";
import {applyAlgorithm} from "./algorithms.common";

export const TRY_NUMBER_ALGORITHM = 'TryNumber';

const _valorize = (sdk: PlaySudoku, cell: PlaySudokuCell, av: string): PlaySudoku => {
  const tc = sdk.cells[cell.id];
  if (tc) tc.value = av;
  checkAvailable(sdk);
  return sdk;
}

/**
 * ALGORITMO
 * Tenta la valorizzazione (brutal force)
 *
 * algoritmo a tentativi, genera tanti schemi quanti valori disponibili affre la
 * cella scelta
 *
 * fattore:  +Km+(KM*NU*NEP)
 * ossia tiene conto di alcuni fattori:
 * - Km = valore costante minimo
 * - KM = valore costante come moltiplicatore
 * - NU = quantità di numeri necessari a completare lo schema da zero
 * - NEP = percentuale di numeri mancanti al riempimento
 *
 * il NEP permette di valutare il fatto che l'algoritmo venga applicato nella
 * parte iniziale del processo di risoluzione (+difficile NEP prossimo a 1) o nella parte
 * finale (+facile NEP prossimo a 0)
 * le costanti permettono di pesare la quota fissa e quella variabile
 */
export class TryNumberAlgorithm extends Algorithm {
  id = TRY_NUMBER_ALGORITHM;
  factor = '+240+(4*NU*NEP)';
  name = 'Try number in cell';
  icon = 'generating_tokens';
  type = AlgorithmType.solver;
  title = 'se una determinata cella può ospitare N numeri, si divide la soluzione in N schemi, uno per ogni valore';
  description = 'Rappresenta l\'applicazione del metodo "brutal force". Questo algoritmo sceglie la prima cella con il numero di valori possibili più basso. Ovviamente rappresenta la difficolta maggiore tra tutti gli algoritmi poiché nella pratica si traduce nell\'andare per tentativi';
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    // ricerca la cella con minor numero di valori possibili fra quelle non valorizzate
    const minc = _minBy(_values(sdk.cells), (c) => c?.value ? 1000 : c?.availables.length || 1000);
    if ((minc?.availables || []).length <= 1) return AlgorithmResult.none(this);

    return applyAlgorithm(this, sdk, (o) => {
      if (minc) {
        const minvalues = _clone(minc.availables);
        const template = _clone(sdk);
        minvalues.forEach((av, index) => {
          if (index === 0) {
            _valorize(sdk, minc, av);
          } else if (!!template) {
            const clone = _clone(template);
            o.cases.push(_valorize(clone, minc, av));
          }
        });
        o.doCheckAvailable = false;
        o.applied = true;
        o.cells[minc.id] = true;
        o.descLines = [new AlgorithmResultLine({
          description: `The schema has been split on cell ${getUserCoord(minc?.id||'unknown')} using the values [${(minc?.availables||[]).join(',')}]`,
          cell: minc?.id,
          withValue: true
        })];
      }
    });
  }
}
