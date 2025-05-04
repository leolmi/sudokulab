import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  checkStatus,
  onCell,
  SudokuCell,
  TRY_NUMBER_ALGORITHM
} from '@olmi/model';
import {
  applyAlgorithm,
  getHighlights,
  getSingleResultLine,
  registerAlgorithm,
} from '../algorithms.common';
import { cloneDeep as _clone, minBy as _minBy } from 'lodash';

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
  priority = 100;
  factor = '+400+(4*NU*NEP)';
  name = 'Try number in cell';
  icon = 'generating_tokens';
  type = AlgorithmType.solver;
  title = 'se una determinata cella può ospitare N numeri, si divide la soluzione in N schemi, uno per ogni valore';
  description = 'Rappresenta l\'applicazione del metodo "brutal force". Questo algoritmo sceglie la prima cella con il numero di valori possibili più basso. Ovviamente rappresenta la difficolta maggiore tra tutti gli algoritmi poiché nella pratica si traduce nell\'andare per tentativi';
  options = <AlgorithmOptions>{}

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      // ricerca la prima cella con minor numero di valori possibili fra quelle non valorizzate
      const cell = _minBy(cells, (c) => c.text ? 1000 : c.available.length || 1000);
      if ((cell?.available || []).length < 1) return;
      res.cases = (cell!.available||[]).map((v) => cloneCellsWithValue(cells, cell, v));
      res.applied = true;
      res.cells = [cell!.id];
      res.highlights = getHighlights(cell!);
      res.descLines = getSingleResultLine(cell!,
        `The schema has been split on cell ${(cell!.coord||'unknown')} using the values [${(cell!.available||[]).join(',')}]`, true);
    });
}

/**
 * fornisce un nuovo set di celle valorizzando la cella fulcro dello split con il valore passato
 * @param cells
 * @param cell
 * @param value
 */
const cloneCellsWithValue = (cells: SudokuCell[], cell: SudokuCell|undefined, value: string): SudokuCell[] => {
  const schema = _clone(cells);
  if (cell) {
    onCell(schema, cell, (c) => {
      c.text = value;
      c.available = [];
    });
    checkStatus(schema);
  }
  return schema;
}

// registra l'algoritmo
// brutal force algorithm
registerAlgorithm(new TryNumberAlgorithm());
