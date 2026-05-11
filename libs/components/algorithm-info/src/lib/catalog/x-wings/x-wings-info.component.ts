import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { XWINGS_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo X-Wings.
 *
 * X-Wings si applica quando un valore V compare come candidato in **esattamente
 * due celle** su due righe distinte, e queste quattro celle sono allineate sulle
 * **stesse due colonne**. In questa configurazione V può essere rimosso da tutte
 * le altre celle di quelle due colonne (e viceversa scambiando righe con colonne).
 */
@Component({
  selector: 'x-wings-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class XWingsInfoComponent {
  readonly key = XWINGS_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale del puzzle (schema "9x9_25num_MEDIUM_(614457223)" preso da
      // documents/catalog.json): definisce le celle fisse, immutabili.
      schema:
        '503020000900308000002000045090004000048000720000200010870000100000705002000090507',

      // Stato della board immediatamente prima del passo in cui il solver applica
      // X-Wings. Include i valori dinamici piazzati dagli algoritmi precedenti: da
      // questo snapshot il preview ricalcola i candidati, così il pattern (1
      // confinato a D3/I3 in colonna 3 e a D4/I4 in colonna 4) è direttamente
      // leggibile sulla griglia.
      values:
        '503427000904358270782900345290004050048500720050200010875602100039705002420090507',

      // Evidenziazioni didattiche (convenzione invertita rispetto al solver):
      // - cell  (primario)   = i quattro vertici del rettangolo X-Wing, cioè il
      //                        pattern che si vuole far notare all'utente.
      // - cell2 (secondario) = tutte le celle impattate dall'applicazione, cioè
      //                        quelle da cui il candidato 1 viene rimosso. Non
      //                        solo la prima riportata dal solver in descLines.
      highlights: `cell D3, I3, D4, I4
cell2 D5, I6`,
    },
  };
}
