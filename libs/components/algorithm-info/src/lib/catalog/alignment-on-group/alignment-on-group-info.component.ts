import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { ALIGNMENT_ON_GROUP_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Alignment On Group.
 *
 * È la tecnica classicamente chiamata "pointing" (box → linea) e "claiming"
 * (linea → box). In un gruppo un valore può comparire solo in celle che
 * appartengono tutte anche ad un altro gruppo "ortogonale": allora in
 * quest'ultimo il valore può essere rimosso da ogni cella che non fa parte
 * dell'intersezione.
 */
@Component({
  selector: 'alignment-on-group-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class AlignmentOnGroupInfoComponent {
  readonly key = ALIGNMENT_ON_GROUP_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale del puzzle (schema MEDIUM dal catalogo): risolvendolo il
      // solver applica AlignmentOnGroup al passo 5 con il valore 6 allineato
      // in colonna 1 (celle B1 e C1, entrambe nel quadrato 1).
      schema:
        '000000600000940000038100004067000000050800010000030900200000081003080006040000720',

      // Snapshot immediatamente prima del passo: include i 5 valori dinamici
      // piazzati ai passi precedenti. Senza questo stato il pattern non è
      // leggibile nei candidati iniziali.
      values:
        '000000600000940100038100004067000800050800010080030960200000081003080006840000720',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = le celle che generano l'allineamento in col 1
      //                        (B1, C1) e che fissano dove potrà finire il 6.
      // - cell2 (secondario) = la cella del quadrato 1 da cui il 6 viene
      //                        rimosso (B3).
      // - col 1 / sqr 1      = i due gruppi coinvolti (allineamento e
      //                        destinazione dell'eliminazione).
      highlights: `cell B1, C1
cell2 B3
col 1
sqr 1`,
    },
  };
}
