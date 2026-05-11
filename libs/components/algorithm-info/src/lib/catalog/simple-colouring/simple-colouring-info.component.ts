import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { SIMPLE_COLOURING_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Simple Colouring (Single Chains).
 *
 * Per un valore V si costruiscono tutte le "coppie coniugate" (gruppi in cui
 * V può andare solo in 2 celle) e si collegano in una catena. Le celle della
 * catena si colorano alternatamente con 2 colori. Due regole classiche:
 * - color-wrap: due celle dello stesso colore nello stesso gruppo → quel
 *   colore è necessariamente FALSE → V si rimuove da tutte le celle di
 *   quel colore;
 * - color-trap: una cella esterna alla catena che "vede" entrambi i colori →
 *   V si rimuove da quella cella.
 */
@Component({
  selector: 'simple-colouring-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class SimpleColouringInfoComponent {
  readonly key = SIMPLE_COLOURING_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale: puzzle proposto per il didattico.
      schema:
        '000900000000360007300002006050109700007000800001804020600700009400058000000006000',

      // Snapshot immediatamente prima del passo 45 (applicazione di Simple
      // Colouring). Per il valore 2 si forma una catena di 8 celle con due
      // colori alternati; due celle di colore B (G2 e I3) condividono il
      // box in basso a sinistra → color-wrap, tutte le celle di colore B
      // perdono il candidato 2.
      values:
        '106947530590361007374582916853129764247635891961874325600713009419258673730496100',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = colore A della catena: A2, B7, I9. Sono le
      //                        celle "opposte" a quelle da cui si rimuove V.
      // - cell2 (secondario) = colore B della catena: A9, G2, B3, G7, I3.
      //                        Sono le celle impattate: perdono tutte il
      //                        candidato 2. In particolare A9/G2/B3/G7
      //                        diventano naked single, I3 resta con {5, 8}.
      highlights: `cell A2, B7, I9
cell2 A9, G2, B3, G7, I3`,
    },
  };
}
