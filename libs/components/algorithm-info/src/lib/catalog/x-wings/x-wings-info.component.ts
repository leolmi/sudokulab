import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { Highlights } from '@olmi/model';
import { SudokuBoardPreviewComponent } from '../../sudoku-board-preview/sudoku-board-preview.component';

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
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Consideriamo un valore <strong>V</strong>. X-Wings vede il pattern
          quando:
        </p>
        <ul>
          <li>
            in <strong>due righe</strong> diverse V può stare in
            <em>esattamente</em> due celle;
          </li>
          <li>
            le due posizioni nelle due righe si trovano sulle
            <strong>stesse due colonne</strong>.
          </li>
        </ul>
        <p>
          Le quattro celle formano un rettangolo ("X-Wing"). Poiché V deve stare
          in entrambe le righe e solo in quelle due colonne, V non può comparire
          in nessun'altra cella di quelle colonne.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — X-Wing per il valore 4</h3>
        <p class="caption">
          Sulle righe <strong>B</strong> e <strong>F</strong> il candidato 4 (in
          verde) è confinato alle sole colonne <strong>1</strong> e
          <strong>6</strong>. Le celle ai quattro vertici del rettangolo sono
          evidenziate.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview
            [values]="example_values_1"
            [highlights]="example_highlights_1"
            [size]="400"
          >
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Dato il pattern, il valore 4 può essere <strong>eliminato</strong> da
          ogni altra cella delle colonne <strong>1</strong> e
          <strong>6</strong>: 4 in quelle colonne può solo finire in uno dei
          quattro vertici del rettangolo.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Le righe B e F devono ciascuna contenere un 4. Se entrambe lo hanno
          solo nelle colonne 1 e 6, una delle due righe prende il 4 in colonna 1
          e l'altra in colonna 6 (sono le uniche due combinazioni possibili). In
          ogni caso le colonne 1 e 6 contengono già i loro 4 nei vertici, quindi
          non possono contenerne altri.
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .alg-page {
        max-width: 820px;
        margin: 0 auto;
      }
      h3 {
        margin: 0 0 8px;
        font-size: 15px;
        font-weight: 600;
        opacity: 0.95;
      }
      p {
        margin: 0 0 8px;
        font-size: 14px;
        line-height: 1.55;
      }
      ul {
        margin: 0 0 8px 20px;
        padding: 0;
      }
      li {
        font-size: 14px;
        line-height: 1.55;
        margin-bottom: 4px;
      }
      .caption {
        font-size: 13px;
        opacity: 0.75;
        font-style: italic;
        text-align: center;
      }
      .example sudoku-board-preview {
        display: inline-block;
        max-width: min(400px, 90vw);
        width: 100%;
      }
    `,
  ],
})
export class XWingsInfoComponent {
  // Schema scelto per mostrare chiaramente un X-Wing sul valore 4.
  // 4 su r2 è confinato a c1/c6, e su r6 è confinato a c1/c6.
  readonly example_values_1 =
    '80030000001200000600009870000430001800000790000000060500890004000100000390000007';

  // Evidenzia i quattro vertici del rettangolo: B1, B6 (riga B = 2a),
  // F1, F6 (riga F = 6a). Formato id cella in SudokuLab: letter+number.
  readonly example_highlights_1 = `cell B1, B6, F1, F6`;
}
