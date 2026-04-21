import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Naked Triple.
 *
 * Tre celle dello stesso gruppo (riga, colonna o quadrato) i cui candidati
 * formano complessivamente solo 3 valori distinti: quei valori devono stare
 * esattamente in quelle tre celle, quindi possono essere rimossi da tutte
 * le altre celle del gruppo.
 */
@Component({
  selector: 'naked-triple-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          In un gruppo si individuano <strong>tre celle</strong> i cui
          candidati, presi in unione, sono <em>esattamente tre valori</em>
          <strong>&#123;X, Y, Z&#125;</strong>. Non serve che ogni cella abbia tutti
          e tre i candidati: può averne due, oppure tutti e tre, l'importante
          è che <strong>ogni candidato delle tre celle</strong> appartenga a
          &#123;X, Y, Z&#125; e che l'unione valga esattamente 3 elementi.
        </p>
        <p>
          In questa configurazione X, Y e Z dovranno occupare proprio
          quelle tre celle (in un qualche ordine), quindi nelle
          <strong>altre</strong> celle del gruppo X, Y e Z possono essere
          rimossi dai candidati.
        </p>
        <p>
          <em>Esempi di configurazioni tipiche</em>: &#123;X, Y&#125; + &#123;Y, Z&#125; + &#123;X, Z&#125;,
          oppure &#123;X, Y, Z&#125; + &#123;X, Y&#125; + &#123;Y, Z&#125;, oppure &#123;X, Y, Z&#125; ripetuto in
          tutte e tre le celle.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — terna (1, 2, 5) in riga H</h3>
        <p class="caption">
          Nella riga <strong>H</strong> le celle
          <strong>H1</strong>, <strong>H3</strong> e <strong>H8</strong>
          (primario) hanno rispettivamente candidati
          &#123;1, 2, 5&#125;, &#123;1, 2, 5&#125; e &#123;2, 5&#125;: l'unione vale esattamente
          &#123;1, 2, 5&#125;. Formano quindi una terna "naked": i valori 1, 2 e 5
          devono andare in quelle tre celle. Nelle altre celle vuote di
          riga H questi valori non sono più ammissibili.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="400">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Effetto concreto (secondario): da <strong>H4</strong> (candidati
          &#123;1, 4, 8&#125;) si rimuove l'1; da <strong>H7</strong> (candidati
          &#123;1, 4, 5&#125;) si rimuovono 1 e 5. H5 (&#123;4, 8&#125;) non ha nessuno dei tre
          valori, quindi resta invariata.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Un gruppo contiene ogni cifra esattamente una volta. Se tre celle
          del gruppo possono contenere complessivamente solo &#123;X, Y, Z&#125;, per
          l'equivalente di una "corrispondenza biunivoca" le tre cifre X, Y,
          Z devono collocarsi in quelle tre celle. Di conseguenza nessun
          altro valore può entrarci, e nelle altre celle del gruppo X, Y, Z
          non sono più candidati validi.
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
export class NakedTripleInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale (schema didattico tratto da un esempio HODOKU che triggera
    // NakedTriple al passo 25 del solve): non presente nel catalogo — lo si può
    // aggiungere a documents/catalog.json per la generazione.
    schema:
      '020009000000000014050620090040060001300000000007010049008000006070003009400025000',

    // Snapshot dello stato immediatamente prima dell'applicazione di
    // NakedTriple. I valori dinamici piazzati dai passi 0-24 portano H1 e H3
    // a candidati {1,2,5} e H8 a {2,5}: configurazione naked triple in riga H.
    values:
      '020009005000008214054621093040060001300004002007012049008007006070003009406025008',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = le tre celle che formano la terna (H1, H3, H8).
    // - cell2 (secondario) = tutte le celle di riga H impattate: H4 (perde 1),
    //                        H7 (perde 1 e 5). H5 ({4,8}) non è toccata e non
    //                        viene evidenziata.
    // - row H              = il gruppo su cui si applica l'algoritmo.
    highlights: `cell H1, H3, H8
cell2 H4, H7
row H`,
  };
}
