import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, SudokuCell } from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, registerAlgorithm } from '../algorithms.common';

export const ONE_VALUE_FOR_CELL_ALGORITHM = 'OneValueForCell';

/**
 * ALGORITMO
 * Unico valore per la cella
 *
 * all'interno di un gruppo la cella può contenere solo un valore
 *
 * fattore: +25
 */
export class OneValueForCellAlgorithm extends Algorithm {
  id = ONE_VALUE_FOR_CELL_ALGORITHM;
  priority = 1;
  // Questo metodo è più difficile da vedere e usare se sono
  // molti i numeri mancanti
  factor = '+25+(NEP*15)';
  name = 'One value for cell';
  icon = 'center_focus_strong';
  type = AlgorithmType.solver;
  title = 'esiste un solo valore possibile per la cella nel gruppo';
  description = 'Non è sempre facile individuare queste situazioni e per questo si è attribuito a questo procedimento un punteggio più alto rispetto al precedente';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      const cell = cells.find(c => c.available.length === 1);
      if (cell) {
        cell.text = cell.available[0];
        res.value = cell.text;
        res.cells = [cell.id];
        res.applied = true;
        res.highlights = getHighlights(cell);
        res.descLines = getSingleResultLine(cell,
          `Cell ${cell?.coord||'unknown'} can only assume the value "${cell?.text}"`, true);
      }
    })
}

// registra l'algoritmo
registerAlgorithm(new OneValueForCellAlgorithm());
