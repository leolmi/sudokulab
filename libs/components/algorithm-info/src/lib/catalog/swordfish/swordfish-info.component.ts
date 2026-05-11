import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { SWORDFISH_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Swordfish.
 *
 * Generalizzazione di X-Wings a 3 righe/colonne: un valore V compare come
 * candidato in (al più) 2-3 celle per ciascuna di 3 righe, e queste celle sono
 * confinate nelle stesse 3 colonne (o viceversa). Nelle altre celle di quelle
 * 3 colonne V può essere rimosso.
 */
@Component({
  selector: 'swordfish-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class SwordfishInfoComponent {
  readonly key = SWORDFISH_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale: puzzle proposto per il didattico (definisce le celle fisse).
      schema:
        '800060000600050930010004000080600000050020060040008010000500090075090001000030007',

      // Snapshot immediatamente prima del passo 52 (applicazione di Swordfish).
      // Include i dinamici piazzati dagli algoritmi precedenti: lo stato esibisce
      // il valore 3 confinato a due celle in ciascuna delle colonne 2, 6, 9,
      // con unione delle righe = {A, E, G} (fish di taglia 3).
      values:
        '807260154624751938510084726080615470751420860046078015108547090075890041400130587',

      // Evidenziazioni didattiche (convenzione invertita rispetto al solver):
      // - cell  (primario)   = le sei celle del fish (due per ciascuna delle
      //                        tre colonne): A2, G2, A6, E6, E9, G9.
      // - cell2 (secondario) = la cella impattata da cui il valore 3 viene
      //                        rimosso: G7 (riga G, fuori dalle tre colonne
      //                        del fish).
      highlights: `cell A2, G2, A6, E6, E9, G9
cell2 G7`,
    },
  };
}
