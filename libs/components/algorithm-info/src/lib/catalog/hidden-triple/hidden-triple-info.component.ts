import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { HIDDEN_TRIPLE_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Hidden Triple.
 *
 * Tre valori che in un gruppo possono stare solo in tre specifiche celle:
 * quelle tre celle devono contenere esattamente quei tre valori, quindi tutti
 * gli altri candidati presenti in quelle celle possono essere rimossi.
 *
 * È la controparte "hidden" del Naked Triple: invece di partire dalle celle e
 * cercare un'unione ristretta di candidati, si parte dai valori e si guarda
 * dove possono essere collocati nel gruppo.
 */
@Component({
  selector: 'hidden-triple-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class HiddenTripleInfoComponent {
  readonly key = HIDDEN_TRIPLE_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Stato parziale costruito apposta per il didattico: NON è un puzzle a
      // soluzione unica, è solo una fotografia di griglia valida (nessun
      // conflitto riga/colonna/quadrato) che esibisce in modo netto il pattern
      // Hidden Triple in riga A.
      //
      // Valori fissati:
      // - riga A: A4=4, A5=5, A6=6, A7=7
      // - riga B: B1=4, B2=5, B3=6, B8=1, B9=2
      // - riga C: C7=3
      //
      // Effetti sui candidati:
      // - A1/A2/A3 hanno candidati {1,2,3,8,9} (5 valori ciascuno);
      // - A8/A9 hanno candidati {8,9}: 1, 2, 3 sono esclusi dal quadrato 3
      //   (B8=1, B9=2, C7=3) e dalle colonne 8/9.
      // Quindi i valori 1, 2 e 3 in riga A possono andare SOLO in A1, A2, A3:
      // hidden triple.
      schema:
        '000456700456000012000000300000000000000000000000000000000000000000000000000000000',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = le tre celle della terna nascosta (A1, A2, A3).
      //                        Sono anche le celle impattate dall'algoritmo:
      //                        da ognuna vanno rimossi i candidati 8 e 9.
      // - row A              = il gruppo in cui vive il pattern.
      highlights: `cell A1, A2, A3
row A`,
    },
  };
}
