import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { ONE_CELL_FOR_VALUE_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo One Cell For Value.
 *
 * È la tecnica più elementare: all'interno di un gruppo (riga, colonna o
 * quadrato) esiste una sola cella in grado di ospitare un determinato valore.
 * In quella cella si può piazzare direttamente il valore.
 */
@Component({
  selector: 'one-cell-for-value-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class OneCellForValueInfoComponent {
  readonly key = ONE_CELL_FOR_VALUE_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale del puzzle "9x9_23num_EASY_(771909447)" preso da
      // documents/catalog.json: il solver applica OneCellForValue già al primo
      // passo sulla cella B3 con il valore 7.
      schema:
        '000100040400900126000007900040000531580000000070600000000009060002750000000002000',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = la cella unica in cui il valore può essere
      //                        piazzato (B3, dove il solver piazza il 7).
      // - cell2 (secondario) = le altre celle vuote del gruppo (riga B) in cui
      //                        lo stesso valore è bloccato da colonna o quadrato.
      highlights: `cell B3
cell2 B2, B5, B6`,
    },
  };
}
