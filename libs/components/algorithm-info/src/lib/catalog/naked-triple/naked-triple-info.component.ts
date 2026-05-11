import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { NAKED_TRIPLE_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Naked Triple.
 *
 * Tre celle dello stesso gruppo (riga, colonna o quadrato) i cui candidati
 * formano complessivamente solo 3 valori distinti: quei valori devono stare
 * esattamente in quelle tre celle, quindi possono essere rimossi da tutte
 * le altre celle del gruppo.
 */
@Component({
  selector: 'naked-triple-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class NakedTripleInfoComponent {
  readonly key = NAKED_TRIPLE_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale (schema didattico tratto da un esempio HODOKU che triggera
      // NakedTriple al passo 25 del solve): non presente nel catalogo — lo si può
      // aggiungere a documents/catalog.json per la generazione.
      schema:
        '020009000000000014050620090040060001300000000007010049008000006070003009400025000',

      // Snapshot dello stato immediatamente prima dell'applicazione di
      // NakedTriple. I valori dinamici piazzati dai passi 0-24 portano H1 e H3
      // a candidati {1,2,5} e H8 a {2,5}: configurazione naked triple in riga H.
      values:
        '020009005000008214054621093040060001300004002007012049008007006070003009406025008',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = le tre celle che formano la terna (H1, H3, H8).
      // - cell2 (secondario) = tutte le celle di riga H impattate: H4 (perde 1),
      //                        H7 (perde 1 e 5). H5 ({4,8}) non è toccata e non
      //                        viene evidenziata.
      // - row H              = il gruppo su cui si applica l'algoritmo.
      highlights: `cell H1, H3, H8
cell2 H4, H7
row H`,
    },
  };
}
