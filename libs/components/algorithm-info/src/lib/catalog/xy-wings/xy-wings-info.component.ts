import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

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
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Si cercano tre celle bivalore collegate a forma di "Y":
        </p>
        <ul>
          <li>
            un <strong>pivot</strong> con candidati
            <strong>&#123;X, Y&#125;</strong>;
          </li>
          <li>
            una <strong>wing</strong> con candidati
            <strong>&#123;X, Z&#125;</strong> che sta in un gruppo comune col
            pivot (riga, colonna o quadrato);
          </li>
          <li>
            un'altra <strong>wing</strong> con candidati
            <strong>&#123;Y, Z&#125;</strong> che sta in un <em>diverso</em>
            gruppo comune col pivot.
          </li>
        </ul>
        <p>
          In questa configurazione il valore <strong>Z</strong> può essere
          rimosso da ogni cella che vede <em>contemporaneamente</em> entrambe
          le wings.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Il pivot vale X oppure Y:
        </p>
        <ul>
          <li>
            se <strong>pivot = X</strong>, la wing &#123;X, Z&#125; non può
            essere X (vede il pivot), quindi vale <strong>Z</strong>;
          </li>
          <li>
            se <strong>pivot = Y</strong>, la wing &#123;Y, Z&#125; non può
            essere Y (vede il pivot), quindi vale <strong>Z</strong>.
          </li>
        </ul>
        <p>
          In ogni scenario <strong>una</strong> delle due wings vale Z: il
          valore Z è quindi già "prenotato" su una di loro e non può più
          stare nelle celle che le vedono entrambe.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — Z = 4 in un puzzle reale</h3>
        <p class="caption">
          Stato dello schema al passo in cui il solver applica XY-Wings.
          Le tre celle in primario formano il pattern:
          pivot <strong>F7</strong> = &#123;7, 9&#125;,
          wing <strong>C7</strong> = &#123;4, 9&#125;
          (stessa colonna 7 del pivot),
          wing <strong>D9</strong> = &#123;4, 7&#125;
          (stesso quadrato del pivot). Il candidato comune alle due wings
          (che ruota attorno al pivot) è <strong>Z = 4</strong>.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Effetto sulle celle impattate (secondario): le celle che vedono
          <em>sia</em> C7 <em>che</em> D9 sono quelle che stanno in
          colonna 9 <em>e</em> nel quadrato in alto a destra. Sono
          <strong>A9</strong> (candidati &#123;4, 7, 8&#125; → perde 4,
          resta &#123;7, 8&#125;) e <strong>C9</strong> (&#123;4, 8&#125;
          → perde 4, resta un naked single &#123;8&#125; che il passo
          successivo valorizzerà).
        </p>
      </div>

      <div>
        <h3>Come riconoscerlo velocemente</h3>
        <p>
          Parti da una cella bivalore, ipotizzala come pivot. Controlla
          nei suoi gruppi (riga, colonna, quadrato) se esistono altre due
          celle bivalore che insieme "coprono" i due valori del pivot più
          un terzo valore comune Z. Se sì, guarda l'intersezione della
          visibilità delle due wings: ogni candidato Z in quelle celle
          sparisce.
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
        max-width: min(420px, 92vw);
        width: 100%;
      }
    `,
  ],
})
export class XYWingsInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
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

    // Evidenziazioni didattiche:
    // - cell  (primario)   = le tre celle del pattern: F7 (pivot),
    //                        C7 e D9 (le due wings).
    // - cell2 (secondario) = tutte le celle impattate dall'algoritmo, non solo
    //                        la prima riportata dal solver in descLines:
    //                        A9 (perde 4) e C9 (perde 4 → naked single 8).
    highlights: `cell F7, C7, D9
cell2 A9, C9`,
  };
}
