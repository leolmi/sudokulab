import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { WWINGS_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo W-Wing.
 *
 * Due celle bivalore con la STESSA coppia {A, B} (le ali), raccordate da un
 * legame forte (coppia coniugata) su uno dei due valori: poiché quel valore
 * occupa per forza uno dei due estremi del legame, almeno un'ala varrà l'altro
 * valore, che può quindi essere escluso dalle celle che vedono entrambe le ali.
 *
 * Tecnica distinta dall'XY-Wings (`XYWings`): lì le tre celle ruotano attorno
 * a un pivot, qui le due ali condividono l'intera coppia e il raccordo è un
 * legame forte.
 */
@Component({
  selector: 'w-wing-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class WWingsInfoComponent {
  readonly key = WWINGS_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale del puzzle "051000600...000270" da documents/catalog.json.
      schema:
        '051000600000401003300002004032010060000283000040070380200600001900708000003000270',

      // Snapshot immediatamente prima del passo in cui scatta il W-Wing.
      // In questo stato: ali E9={5,9} e I6={5,9}; in colonna 1 il 5 è confinato
      // tra E1 e I1 (legame forte); il bersaglio I9={5,6,9} perde il 9.
      values:
        '451397628028401003300802004832014067000283000140076382270630801910728030083140270',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = il pattern: ali E9, I6 + estremi del legame forte E1, I1.
      // - cell2 (secondario) = la cella impattata I9 (perde il 9).
      highlights: `cell E9, I6, E1, I1
cell2 I9`,
    },
  };
}
