import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { ONE_VALUE_FOR_CELL_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo One Value For Cell.
 *
 * Una cella ha un solo candidato possibile: tutti gli altri otto valori sono
 * già presenti nella sua riga, nella sua colonna o nel suo quadrato. In quella
 * cella si può piazzare direttamente l'unico valore rimasto.
 */
@Component({
  selector: 'one-value-for-cell-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class OneValueForCellInfoComponent {
  readonly key = ONE_VALUE_FOR_CELL_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale del puzzle (schema HARD preso da documents/catalog.json):
      // risolvendolo il solver applica OneValueForCell la prima volta al passo 2
      // sulla cella A5 (valore 7).
      schema:
        '034002109070004000000050060060003201050080003003000000000060000695700000017040000',

      // Snapshot immediatamente prima del passo OneValueForCell: include i due
      // valori dinamici piazzati ai passi 0-1 dall'algoritmo precedente
      // (OneCellForValue). Con questi valori A5 resta con un solo candidato: 7.
      values:
        '034602109076004000000050060060003201050080003003000000000060000695700000017040000',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = la cella vincolata al valore unico (A5).
      // - row/col/sqr        = i tre gruppi che, insieme, eliminano gli altri
      //                        otto candidati dalla cella.
      highlights: `cell A5
row A
col 5
sqr 2`,
    },
  };
}
