import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { XYWINGS_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo XY-Wings.
 *
 * Tre celle bivalore in configurazione a "Y" con un pivot e due "ali":
 * pivot {X, Y}, ali {X, Z} e {Y, Z}. In ogni caso una delle due ali varrà Z,
 * quindi Z può essere escluso da tutte le celle che vedono entrambe le ali.
 */
@Component({
  selector: 'xy-wings-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class XYWingsInfoComponent {
  readonly key = XYWINGS_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale del puzzle "9x9_25num_VERYHARD_(-247810194)" da
      // documents/catalog.json: definisce le celle fisse.
      schema:
        '000090130004800602200700050060951300400000000000206000080030000000000819001000500',

      // Snapshot immediatamente prima del passo 17 (applicazione di XY-Wings).
      // Include i dinamici piazzati dagli algoritmi precedenti: in questo stato
      // i candidati delle tre celle chiave sono F7={7,9}, C7={4,9}, D9={4,7} —
      // la configurazione XY-Wing con pivot F7 e Z=4.
      values:
        '000092130004810602210760050060951300400300061100246005080130006000000819001000503',

      // Override didattico: con le sole regole base D9 esce {4,7,8}; il
      // pattern XY-Wing richiede D9={4,7} (l'8 è eliminabile solo con
      // tecniche intermedie). Forziamo lo stato coerente col testo.
      available: {
        D9: '4 7',
      },

      // Evidenziazioni didattiche:
      // - cell  (primario)   = le tre celle del pattern: F7 (pivot),
      //                        C7 e D9 (le due wings).
      // - cell2 (secondario) = tutte le celle impattate dall'algoritmo, non solo
      //                        la prima riportata dal solver in descLines:
      //                        A9 (perde 4) e C9 (perde 4 → naked single 8).
      highlights: `cell F7, C7, D9
cell2 A9, C9`,
    },
  };
}
