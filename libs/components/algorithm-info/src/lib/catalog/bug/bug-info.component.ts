import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { BUG_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo BUG (Bi-value Universal Grave).
 *
 * Tecnica endgame: si applica quando lo schema è quasi completo e tutte le
 * celle ancora vuote sono bi-valore tranne UNA che ha 3 candidati. Sfrutta
 * il vincolo di soluzione unica per escludere dal trivalente il candidato
 * che lascerebbe una "bi-value grave" (schema a doppia soluzione).
 *
 * Il componente è un guscio: tutto il testo didattico vive nei file
 * `apps/sudoku/public/i18n/algorithms/Bug.<lang>.md`, mentre il sample
 * della board (typed) resta in TS.
 */
@Component({
  selector: 'bug-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class BugInfoComponent {
  readonly key = BUG_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale: puzzle proposto per il didattico.
      schema:
        '000000002400000190037800065070038000004060300000790040580003910019000008200000000',

      // Snapshot immediatamente prima del passo 37 (applicazione di BUG).
      // Lo stato ha 18 celle vuote: tutte bi-valore tranne D9 che ha 3
      // candidati {1, 6, 9}. Il valore 1 compare esattamente 2 volte nei
      // tre gruppi di D9 (riga D, colonna 9, box 6) → bug-value. Rimuovendo
      // 1 da D9 si scardina la bi-value grave.
      values:
        '005314782428657193137829465070438000804160300300790840586273914719546238243981000',

      // Override didattico: E8 dalle regole base esce con {2,5,7} perché il 5
      // è eliminabile solo considerando che in quel box può stare unicamente
      // sull'allineamento della riga D. Qui lo forziamo a {2,7} per mostrare
      // uno stato coerente con l'ipotesi BUG (tutte bi-value tranne D9).
      available: {
        E8: '2 7',
      },

      // Evidenziazioni didattiche:
      // - cell  (primario)   = D9, la cella "trivalente" da cui si rimuove 1.
      // - cell2 (secondario) = D3 e F9, le due celle "testimone" del
      //                        bug-value: insieme a D9 formano le coppie
      //                        da due occorrenze di 1 in riga D, colonna 9
      //                        e box 6.
      highlights: `cell D9
cell2 D3, F9`,
    },
  };
}
