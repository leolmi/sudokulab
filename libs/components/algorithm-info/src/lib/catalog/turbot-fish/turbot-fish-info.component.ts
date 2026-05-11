import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { TURBOTFISH_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Turbot Fish.
 *
 * Il pattern si costruisce su tre gruppi concatenati in cui un valore V ha
 * coppie di posizioni (strong link): due gruppi "estremi" (g1, g3) più un
 * gruppo di raccordo (g2) che condivide una cella con g1 e una con g3. I
 * due veri "estremi" della catena — le celle di g1 e g3 non toccate da g2
 * — devono essere uno acceso e l'altro spento; quindi ogni cella esterna
 * che vede entrambi non può ospitare V. Skyscraper, Two-String Kite e
 * Empty Rectangle sono le varianti classiche di Turbot Fish.
 */
@Component({
  selector: 'turbot-fish-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class TurbotFishInfoComponent {
  readonly key = TURBOTFISH_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale: schema proposto dall'utente (ammette più soluzioni, ma
      // uno dei rami del solver — via TryNumber — esibisce un Turbot Fish
      // pulito sul valore 1 prima di chiudersi).
      schema:
        '003008000000200100060040070040005080008000600050900010090020040007006000000100500',

      // Snapshot immediatamente prima dell'applicazione di Turbot Fish in quel
      // ramo: il valore 1 ha strong link in rigaA {A1,A5}, quadrato 2 {A5,C6}
      // e colonna 6 {C6,E6}. La catena collega A1 a E6 attraverso A5 e C6.
      values:
        '073508000080200100060340070040605080008700600050980010090023740007056000000100500',

      // Evidenziazioni didattiche (convenzione invertita rispetto al solver):
      // - cell  (primario)   = le 4 celle della catena di strong link:
      //                        A1, A5, C6, E6. A1 ed E6 sono gli estremi
      //                        "alternativi"; A5 e C6 sono le celle interne
      //                        condivise con il raccordo.
      // - cell2 (secondario) = la cella impattata da cui il valore 1 viene
      //                        rimosso: E1 (vede A1 in colonna ed E6 in riga).
      highlights: `cell A1, A5, C6, E6
cell2 E1`,
    },
  };
}
