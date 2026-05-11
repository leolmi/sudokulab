import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { HIDDEN_QUAD_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Hidden Quad.
 *
 * Quattro valori che in un gruppo possono stare solo in quattro specifiche
 * celle: quelle quattro celle devono contenere esattamente quei quattro valori,
 * quindi tutti gli altri candidati presenti in quelle celle possono essere
 * rimossi.
 *
 * È la controparte "hidden" del Naked Quad: invece di partire dalle celle e
 * cercare un'unione ristretta di candidati, si parte dai valori e si guarda
 * dove possono essere collocati nel gruppo.
 */
@Component({
  selector: 'hidden-quad-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class HiddenQuadInfoComponent {
  readonly key = HIDDEN_QUAD_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Stato parziale costruito apposta per il didattico: NON è un puzzle a
      // soluzione unica, è una fotografia di griglia valida (nessun conflitto
      // riga/colonna/quadrato) che esibisce in modo netto il pattern Hidden Quad
      // in riga A.
      //
      // Valori fissati:
      // - riga A: A5=5, A6=6
      // - riga B: B3=8, B5=7, B7=1, B9=2
      // - riga C: C2=7, C5=8, C7=3, C8=4
      //
      // Effetti sui candidati:
      // - A1/A2/A3/A4 hanno candidati {1,2,3,4,9}: i 5 valori possibili dopo
      //   avere escluso 5,6 (riga) e 7,8 (box 1 o box 2).
      // - A7/A8/A9 hanno candidati {7,8,9}: i valori 1,2,3,4 sono esclusi dal
      //   box in alto a destra (B7=1, B9=2, C7=3, C8=4).
      // Quindi i valori 1,2,3,4 in riga A possono andare SOLO in A1,A2,A3,A4:
      // hidden quad.
      schema:
        '000056000008070102070080340000000000000000000000000000000000000000000000000000000',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = le quattro celle della quaterna nascosta
      //                        (A1, A2, A3, A4). Sono anche le celle impattate:
      //                        da ognuna va rimosso il candidato 9.
      // - row A              = il gruppo in cui vive il pattern.
      highlights: `cell A1, A2, A3, A4
row A`,
    },
  };
}
