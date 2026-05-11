import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary, TRY_NUMBER_ALGORITHM } from '@olmi/model';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Try Number (brute-force con euristica
 * MRV + Degree).
 *
 * Ultima spiaggia: quando nessuna tecnica logica progredisce oltre, il solver
 * sceglie una cella "furba" (minimo numero di candidati, massimo numero di
 * celle vuote visibili) e si dirama in N schemi paralleli, uno per ciascun
 * candidato. Ciascun ramo viene poi risolto (o scartato se incompatibile).
 */
@Component({
  selector: 'try-number-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class TryNumberInfoComponent {
  readonly key = TRY_NUMBER_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale: puzzle proposto per il didattico.
      schema:
        '700030012000008034000400800005802060800000001060305200004009000180700000930050008',

      // Snapshot immediatamente prima del passo 21 (applicazione di Try Number).
      // Lo stato ha molte celle bi-valore e nessun altro algoritmo del catalogo
      // può progredire senza biforcazione. L'euristica MRV + Degree sceglie H5
      // (candidati {4, 6}) come cella di split.
      values:
        '748036012000008034003400800305802460800000351460305280004089003180703000930050008',

      // Override didattico: con le sole regole base H5 esce {2,4,6};
      // l'euristica MRV sceglie H5={4,6} perché il 2 viene eliminato da
      // tecniche intermedie. Forziamo lo stato coerente col testo.
      available: {
        H5: '4 6',
      },

      // Evidenziazioni didattiche:
      // - cell (primario) = H5, la cella su cui il solver "tenta" la dirama.
      highlights: `cell H5`,
    },
  };
}
