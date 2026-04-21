import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

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
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Si prende un gruppo (riga, colonna o quadrato) e una coppia di
          valori <strong>X</strong> e <strong>Y</strong>. Se nel gruppo
          <strong>sia X che Y</strong> possono stare solo nelle stesse due
          celle — nessun'altra posizione del gruppo ammette né X né Y —
          allora quelle due celle <em>sono i gemelli</em>: devono contenere
          esattamente X e Y.
        </p>
        <p>Conseguenze (in SudokuLab applicate nello stesso passo):</p>
        <ul>
          <li>
            dalle <strong>due celle gemelle</strong> si possono rimuovere
            tutti i candidati diversi da X e Y;
          </li>
          <li>
            dalle <strong>altre celle</strong> di ogni gruppo che contiene
            entrambi i gemelli (riga, colonna o quadrato comune) si possono
            rimuovere X e Y, se presenti.
          </li>
        </ul>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — coppia (6, 7) in riga D</h3>
        <p class="caption">
          Nella riga <strong>D</strong> i valori <strong>6</strong> e
          <strong>7</strong> possono comparire solo in <strong>D2</strong> e
          <strong>D4</strong> (evidenziate in primario). Oggi quelle celle
          contengono anche altri candidati — D2 ha &#123;2, 4, 6, 7&#125; e D4 ha
          &#123;2, 6, 7, 8&#125; — ma siccome 6 e 7 devono andare per forza lì, gli
          altri candidati di D2 e D4 diventano impossibili.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="400">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Dopo l'applicazione dell'algoritmo D2 e D4 restano con i soli
          candidati &#123;6, 7&#125;. Inoltre, se in altre celle di riga D (o di ogni
          altro gruppo comune ai gemelli) comparissero ancora 6 o 7, si
          potrebbero rimuovere: qui non serve perché 6 e 7 già non sono
          candidati altrove in riga D.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Ogni gruppo del sudoku contiene ogni cifra 1–9 esattamente una
          volta. Se X e Y possono stare <em>solo</em> in due celle di un
          gruppo, quelle due celle devono ospitare X e Y (non esiste altra
          collocazione). Nessun altro valore può quindi occuparle, e X/Y non
          possono finire in altre celle che dividano un gruppo con entrambi
          i gemelli.
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
export class TwinsInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
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
  };
}
