import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { UNIQUE_RECTANGLE_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Unique Rectangle.
 *
 * Tecnica di uniqueness: sfrutta il vincolo di soluzione unica del puzzle
 * per evitare il "deadly pattern" (quattro celle ai vertici di un rettangolo,
 * su 2 righe × 2 colonne × 2 box, tutte con gli stessi 2 candidati — uno
 * schema del genere avrebbe almeno 2 soluzioni).
 */
@Component({
  selector: 'unique-rectangle-info',
  standalone: true,
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class UniqueRectangleInfoComponent {
  readonly key = UNIQUE_RECTANGLE_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
      // Clue iniziale: puzzle proposto per il didattico (definisce le celle fisse).
      schema:
        '700200000006090150400000000030705090008000500010608020000000005089010700000002006',

      // Snapshot immediatamente prima del passo 35 (applicazione di Unique
      // Rectangle). Include i dinamici piazzati dai passi precedenti: lo stato
      // esibisce quattro celle ai vertici di un rettangolo su righe A/C e
      // colonne 3/6, distribuite in box 1 e box 2:
      //   - A3=[1,3], C3=[1,3], C6=[1,3]   (tre celle bi-valore)
      //   - A6=[1,3,4]                     (il vertice "esteso" con 4)
      // Per evitare il deadly pattern su {1,3}, A6 perde 1 e 3 → naked single {4}.
      values:
        '700200600826097150400060270634725891278109560915608027062070005089016702047002006',

      // Evidenziazioni didattiche:
      // - cell  (primario)   = i tre vertici bi-valore {1,3} (A3, C3, C6):
      //                        sono le celle "rigide" del deadly pattern.
      // - cell2 (secondario) = il quarto vertice A6, dal quale vengono
      //                        rimossi 1 e 3 per impedire la doppia soluzione.
      // I quattro vertici del rettangolo sono tutti evidenziati (in due colori
      // diversi) e delineano visivamente la forma.
      highlights: `cell A3, C3, C6
cell2 A6`,
    },
  };
}
