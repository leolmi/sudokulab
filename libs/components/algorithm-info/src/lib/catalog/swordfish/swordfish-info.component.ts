import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Swordfish.
 *
 * Generalizzazione di X-Wings a 3 righe/colonne: un valore V compare come
 * candidato in (al più) 2-3 celle per ciascuna di 3 righe, e queste celle sono
 * confinate nelle stesse 3 colonne (o viceversa). Nelle altre celle di quelle
 * 3 colonne V può essere rimosso.
 */
@Component({
  selector: 'swordfish-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Consideriamo un valore <strong>V</strong>. Swordfish vede il pattern
          quando:
        </p>
        <ul>
          <li>
            in <strong>tre colonne</strong> distinte V può stare solo in
            2-3 celle ciascuna;
          </li>
          <li>
            l'unione di tutte queste posizioni cade <em>esattamente</em>
            nelle stesse <strong>tre righe</strong>.
          </li>
        </ul>
        <p>
          (Vale il simmetrico scambiando righe con colonne.) Le tre righe
          "catturano" tutti i 1-2-3 posti liberi per V nelle tre colonne.
          Quindi in quelle tre righe V deve necessariamente stare dentro
          le tre colonne del fish: può essere rimosso da tutte le altre
          celle di quelle tre righe.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Ciascuna delle tre colonne deve contenere V (è una cifra del
          sudoku). Poiché in ciascuna colonna V può stare solo in una delle
          tre righe scelte, complessivamente V occupa esattamente tre celle
          all'intersezione colonne × righe del fish (una per colonna, una
          per riga — corrispondenza biunivoca). Di conseguenza ciascuna
          riga ha già "il suo" V localizzato in quelle colonne: nelle
          altre celle della stessa riga V non può più comparire.
        </p>
        <p>
          X-Wings è il caso N = 2 di questa stessa logica; Swordfish è
          N = 3; Jellyfish è N = 4.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — Swordfish per il valore 3</h3>
        <p class="caption">
          Stato al passo in cui il solver applica Swordfish. Il candidato
          <strong>3</strong> è confinato a due sole celle in ciascuna di
          tre colonne:
        </p>
        <ul class="reasons">
          <li>colonna 2: <strong>A2</strong>, <strong>G2</strong>;</li>
          <li>colonna 6: <strong>A6</strong>, <strong>E6</strong>;</li>
          <li>colonna 9: <strong>E9</strong>, <strong>G9</strong>.</li>
        </ul>
        <p class="caption">
          L'unione di queste sei posizioni tocca <em>solo</em> le righe
          <strong>A</strong>, <strong>E</strong> e <strong>G</strong>:
          il pattern è completo.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Effetto (secondario): in riga G il solver rimuove 3 da
          <strong>G7</strong> (candidati &#123;2, 3, 6&#125; → &#123;2, 6&#125;).
          Riga A ed E sono già tutte filled fuori dalle colonne del fish,
          quindi non producono ulteriori eliminazioni.
        </p>
      </div>

      <div>
        <h3>Come riconoscerlo velocemente</h3>
        <p>
          Scegli un valore V e guarda, per ogni colonna, in quante righe
          può ancora andare (le colonne con 1 posizione sono naked
          singles; ignorale). Cerca tre colonne dove V ha rispettivamente
          2-3 posizioni, e annota le righe coinvolte: se l'unione ha
          esattamente 3 righe, hai uno Swordfish.
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
      .reasons {
        max-width: 640px;
        margin: 0 auto 12px;
      }
      .example sudoku-board-preview {
        display: inline-block;
        max-width: min(420px, 92vw);
        width: 100%;
      }
    `,
  ],
})
export class SwordfishInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale: puzzle proposto per il didattico (definisce le celle fisse).
    schema:
      '800060000600050930010004000080600000050020060040008010000500090075090001000030007',

    // Snapshot immediatamente prima del passo 52 (applicazione di Swordfish).
    // Include i dinamici piazzati dagli algoritmi precedenti: lo stato esibisce
    // il valore 3 confinato a due celle in ciascuna delle colonne 2, 6, 9,
    // con unione delle righe = {A, E, G} (fish di taglia 3).
    values:
      '807260154624751938510084726080615470751420860046078015108547090075890041400130587',

    // Evidenziazioni didattiche (convenzione invertita rispetto al solver):
    // - cell  (primario)   = le sei celle del fish (due per ciascuna delle
    //                        tre colonne): A2, G2, A6, E6, E9, G9.
    // - cell2 (secondario) = la cella impattata da cui il valore 3 viene
    //                        rimosso: G7 (riga G, fuori dalle tre colonne
    //                        del fish).
    highlights: `cell A2, G2, A6, E6, E9, G9
cell2 G7`,
  };
}
