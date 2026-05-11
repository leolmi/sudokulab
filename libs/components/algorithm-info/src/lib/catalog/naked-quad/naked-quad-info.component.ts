import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { NAKED_QUAD_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Naked Quad.
 *
 * Quattro celle dello stesso gruppo (riga, colonna o quadrato) i cui candidati
 * formano complessivamente solo 4 valori distinti: quei valori devono stare
 * esattamente in quelle quattro celle, quindi possono essere rimossi da tutte
 * le altre celle del gruppo.
 */
@Component({
  selector: 'naked-quad-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class NakedQuadInfoComponent {
  readonly key = NAKED_QUAD_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale del puzzle "9x9_26num_EXTREME_T2_(-1553683791)" da
      // documents/catalog.json: definisce le celle fisse del puzzle.
      schema:
        '000008103000090507300701009080003000002870000900025000800000050700009308060400000',

      // Snapshot immediatamente prima del passo 16 (applicazione di NakedQuad).
      // I valori dinamici piazzati dagli algoritmi precedenti portano la colonna 8
      // ad avere A8={4,6}, B8={4,6,8}, C8={2,4,6,8}, H8={2,4,6}: unione = {2,4,6,8},
      // esattamente 4 valori → naked quad in colonna 8.
      values:
        '000008103000390507300701009080903000002870000900025000800030050700009308563480000',

      // Override didattico: con le sole regole base A8 esce {2,4,6}; la
      // quaterna {2,4,6,8} funziona comunque, ma per coerenza col testo
      // — che dichiara A8={4,6} — forziamo la riduzione.
      available: {
        A8: '4 6',
      },

      // Evidenziazioni didattiche:
      // - cell  (primario)   = le quattro celle che formano la quaterna
      //                        (A8, B8, C8, H8).
      // - cell2 (secondario) = tutte le celle di colonna 8 impattate dall'algoritmo,
      //                        non solo la prima riportata dal solver in descLines
      //                        (D8 perde 2,4,6; E8 perde 4,6; F8 perde 4,6,8;
      //                        I8 perde 2).
      // - col 8              = il gruppo su cui si applica l'algoritmo.
      highlights: `cell A8, B8, C8, H8
cell2 D8, E8, F8, I8
col 8`,
    },
  };
}
