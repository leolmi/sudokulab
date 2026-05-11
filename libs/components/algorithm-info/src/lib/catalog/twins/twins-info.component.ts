import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { TWINS_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Twins (Naked Pair).
 *
 * In un gruppo esistono due celle (i "gemelli") che condividono la stessa
 * coppia di valori {X, Y} come posizioni possibili: nessun'altra cella del
 * gruppo può ospitare X o Y. Di conseguenza quelle due celle devono
 * contenere esattamente X e Y (in un ordine o nell'altro), e si possono
 * eliminare gli altri candidati da loro e dalle altre celle del gruppo.
 */
@Component({
  selector: 'twins-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class TwinsInfoComponent {
  readonly key = TWINS_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale del puzzle (schema "9x9_23num_MEDIUM_(...)" dal catalogo).
      // Risolvendolo il solver applica Twins al primo passo (step 0) proprio
      // sulla riga D, rilevando la coppia (6, 7) confinata in D2/D4.
      schema:
        '000500001007060040090008600500003900080000060001400007006100050010070800400009000',

      // Twins è applicato al passo 0: schema e values coincidono (nessun valore
      // dinamico piazzato prima). Il preview ricalcola i candidati dallo schema:
      // in riga D si vede che 6 e 7 restano possibili solo in D2 e D4.

      // Evidenziazioni didattiche:
      // - cell  (primario)   = le due celle gemelle D2 e D4.
      // - row D (gruppo)     = la riga su cui il pattern è stato trovato.
      highlights: `cell D2, D4
row D`,
    },
  };
}
