import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Naked Quad.
 *
 * Quattro celle dello stesso gruppo (riga, colonna o quadrato) i cui candidati
 * formano complessivamente solo 4 valori distinti: quei valori devono stare
 * esattamente in quelle quattro celle, quindi possono essere rimossi da tutte
 * le altre celle del gruppo.
 */
@Component({
  selector: 'naked-quad-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          In un gruppo si individuano <strong>quattro celle</strong> i cui
          candidati, presi in unione, sono <em>esattamente quattro valori</em>
          <strong>&#123;W, X, Y, Z&#125;</strong>. Non serve che ogni cella abbia
          tutti e quattro i candidati: può averne due, tre o quattro, l'importante
          è che <strong>ogni candidato delle quattro celle</strong> appartenga a
          &#123;W, X, Y, Z&#125; e che l'unione valga esattamente 4 elementi.
        </p>
        <p>
          In questa configurazione W, X, Y e Z dovranno occupare proprio
          quelle quattro celle (in un qualche ordine), quindi nelle
          <strong>altre</strong> celle del gruppo W, X, Y, Z possono essere
          rimossi dai candidati.
        </p>
        <p>
          È l'estensione diretta di <em>Naked Triple</em> a quattro celle: più
          raro, perché trovare quattro celle che "collaborano" su quattro soli
          valori all'interno dello stesso gruppo è una coincidenza meno frequente
          — ma la logica di esclusione è identica.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — quaterna (2, 4, 6, 8) in colonna 8</h3>
        <p class="caption">
          Nella <strong>colonna 8</strong> le celle
          <strong>A8</strong>, <strong>B8</strong>, <strong>C8</strong> e
          <strong>H8</strong> (primario) hanno rispettivamente candidati
          &#123;4, 6&#125;, &#123;4, 6, 8&#125;, &#123;2, 4, 6, 8&#125; e
          &#123;2, 4, 6&#125;: l'unione vale esattamente
          &#123;2, 4, 6, 8&#125;. Formano quindi una quaterna "naked": i valori
          2, 4, 6 e 8 devono andare in quelle quattro celle. Nelle altre celle
          vuote di colonna 8 questi valori non sono più ammissibili.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="400">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Effetto concreto (secondario): da <strong>D8</strong> (candidati
          &#123;1, 2, 4, 6, 7&#125;) si rimuovono 2, 4 e 6; da
          <strong>E8</strong> (&#123;1, 3, 4, 6, 9&#125;) si rimuovono 4 e 6;
          da <strong>F8</strong> (&#123;1, 3, 4, 6, 7, 8&#125;) si rimuovono
          4, 6 e 8; da <strong>I8</strong> (&#123;1, 2, 7, 9&#125;) si rimuove 2.
          In particolare D8 resta con &#123;1, 7&#125; e E8 con &#123;1, 3, 9&#125;,
          due riduzioni notevoli che sbloccano i passi successivi.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Un gruppo contiene ogni cifra esattamente una volta. Se quattro celle
          del gruppo possono contenere complessivamente solo &#123;W, X, Y, Z&#125;,
          per una corrispondenza biunivoca le quattro cifre W, X, Y, Z devono
          collocarsi in quelle quattro celle. Di conseguenza nessun altro valore
          può entrarci, e nelle altre celle del gruppo W, X, Y, Z non sono più
          candidati validi.
        </p>
      </div>

      <div>
        <h3>Come riconoscerlo velocemente</h3>
        <p>
          Cerca gruppi dove restano 5–6 celle vuote con pochi candidati
          "concentrati" su quattro valori. Se quattro di quelle celle hanno
          candidati tutti contenuti in un sottoinsieme di 4 valori, hai una
          naked quad. Configurazioni frequenti:
        </p>
        <ul>
          <li>due celle con 2 candidati + due celle con 3 candidati (es. &#123;W, X&#125; + &#123;Y, Z&#125; + &#123;W, X, Y&#125; + &#123;X, Y, Z&#125;);</li>
          <li>tre celle con 3 candidati + una cella con 4 candidati;</li>
          <li>tutte e quattro le celle con esattamente gli stessi 4 candidati.</li>
        </ul>
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
export class NakedQuadInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale del puzzle "9x9_26num_EXTREME_T2_(-1553683791)" da
    // documents/catalog.json: definisce le celle fisse del puzzle.
    schema:
      '000008103000090507300701009080003000002870000900025000800000050700009308060400000',

    // Snapshot immediatamente prima del passo 16 (applicazione di NakedQuad).
    // I valori dinamici piazzati dagli algoritmi precedenti portano la colonna 8
    // ad avere A8={4,6}, B8={4,6,8}, C8={2,4,6,8}, H8={2,4,6}: unione = {2,4,6,8},
    // esattamente 4 valori → naked quad in colonna 8.
    values:
      '000008103000390507300701009080903000002870000900025000800030050700009308563480000',

    // Override didattico: con le sole regole base A8 esce {2,4,6}; la
    // quaterna {2,4,6,8} funziona comunque, ma per coerenza col testo
    // — che dichiara A8={4,6} — forziamo la riduzione.
    available: {
      A8: '4 6',
    },

    // Evidenziazioni didattiche:
    // - cell  (primario)   = le quattro celle che formano la quaterna
    //                        (A8, B8, C8, H8).
    // - cell2 (secondario) = tutte le celle di colonna 8 impattate dall'algoritmo,
    //                        non solo la prima riportata dal solver in descLines
    //                        (D8 perde 2,4,6; E8 perde 4,6; F8 perde 4,6,8;
    //                        I8 perde 2).
    // - col 8              = il gruppo su cui si applica l'algoritmo.
    highlights: `cell A8, B8, C8, H8
cell2 D8, E8, F8, I8
col 8`,
  };
}
