import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { COUPLES_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Couples (Couples over groups).
 *
 * Tre celle bivalore collegate in catena che permettono di eliminare un valore
 * da celle che "vedono" due punte della catena:
 *
 *   XY -- YZ           XY -- YZ
 *    |         oppure          |
 *    |                         |
 *   XZ     -Z          -X     ZX
 *
 * È la formulazione "in-group" dell'XY-Wing: le due celle XY e YZ stanno nello
 * stesso gruppo (riga/colonna/quadrato), mentre XZ sta in un altro gruppo
 * comune con una delle due.
 */
@Component({
  selector: 'couples-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class CouplesInfoComponent {
  readonly key = COUPLES_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Stato costruito ad hoc: esibisce in colonna 1 tre celle bivalore
      // (A1={1,2}, D1={2,3}, B1={1,3}) che formano la catena Couples.
      //
      // Valori fissati:
      // - Riga A: A4=3, A7=9
      // - Riga B: B5=2, B6=9
      // - Riga C: C6=4
      // - Riga D: D4=1, D8=9
      // - Riga E: E1=4, E6=7
      // - Riga F: F1=5
      // - Riga G: G1=6, G5=1
      // - Riga H: H1=7
      // - Riga I: I1=8
      //
      // Candidati risultanti delle celle chiave:
      // - A1={1,2}, B1={1,3}, D1={2,3}: la terna Couples.
      // - C1={1,2,3,9}: cella impattata (perde 3).
      //
      // Nota: il solver su questo stato applicherebbe prima OneCellForValue
      // (C1=9 è hidden single in col 1), quindi Couples non scatta in pratica
      // — lo schema è pensato solo per mostrare visivamente il pattern.
      schema:
        '000300900000029000000004000000100090400007000500000000600010000700000000800000000',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = le tre celle che formano la catena (A1, B1, D1).
      // - cell2 (secondario) = la cella impattata (C1, da cui si rimuove 3).
      // - col 1              = il gruppo comune in cui vive la catena.
      highlights: `cell A1, B1, D1
cell2 C1
col 1`,
    },
  };
}
