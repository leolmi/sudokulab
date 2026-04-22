import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo BUG (Bi-value Universal Grave).
 *
 * Tecnica endgame: si applica quando lo schema è quasi completo e tutte le
 * celle ancora vuote sono bi-valore tranne UNA che ha 3 candidati. Sfrutta
 * il vincolo di soluzione unica per escludere dal trivalente il candidato
 * che lascerebbe una "bi-value grave" (schema a doppia soluzione).
 */
@Component({
  selector: 'bug-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>L'idea — la "bi-value grave"</h3>
        <p>
          Immagina uno schema in cui <strong>tutte</strong> le celle ancora
          da valorizzare sono <em>bi-valore</em> (hanno esattamente 2
          candidati) e in cui <strong>ogni valore</strong> compare in
          <em>esattamente 2 celle</em> di ogni gruppo (riga, colonna,
          quadrato). Questa configurazione si chiama
          <strong>bi-value universal grave</strong>: comunque si scelga
          un valore per una cella, il suo "gemello" nel gruppo prende
          l'altro. Il problema è che una seconda scelta invertita
          produrrebbe una seconda soluzione altrettanto valida.
        </p>
        <p>
          Se lo schema ha soluzione <em>unica</em> (come in SudokuLab) la
          bi-value grave non può essere raggiunta: deve esserci
          <em>almeno una</em> cella con 3 candidati che "rompe" la
          simmetria e scardina la doppia soluzione.
        </p>
      </div>

      <div>
        <h3>Quando si applica</h3>
        <p>Nello stato corrente valgono tutte queste condizioni:</p>
        <ul>
          <li>
            tutte le celle vuote tranne una hanno <strong>2 candidati</strong>;
          </li>
          <li>
            una <em>sola</em> cella — chiamiamola <strong>T</strong> — ha
            <strong>3 candidati</strong>;
          </li>
          <li>
            per uno dei tre candidati <strong>V</strong>, in
            <em>ogni gruppo</em> (riga/colonna/quadrato) a cui
            <strong>T</strong> appartiene, V è presente come candidato
            <em>esattamente 2 volte</em>.
          </li>
        </ul>
        <p>
          Se T valesse V, tutti i gruppi di T avrebbero V piazzato
          localmente e il resto della griglia ricadrebbe esattamente in
          una bi-value grave — cioè in uno schema a doppia soluzione.
          Impossibile, dunque <strong>V può essere rimosso dai candidati
          di T</strong>. Se il trivalente resta con 2 candidati utili, il
          passo successivo (spesso un naked pair/single) chiude il
          puzzle.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — BUG+1 sulla cella D9</h3>
        <p class="caption">
          Stato al passo in cui il solver applica BUG. Nella griglia ci
          sono 18 celle ancora vuote: tutte hanno 2 candidati tranne
          <strong>D9</strong> (in primario) che ne ha 3 — &#123;1, 6, 9&#125;.
          Il valore 1 è presente esattamente due volte in ciascuno dei
          tre gruppi di D9:
        </p>
        <ul class="reasons">
          <li>
            riga D: &#123;1&#125; in <strong>D3</strong>, D9;
          </li>
          <li>
            colonna 9: &#123;1&#125; in D9, <strong>F9</strong>;
          </li>
          <li>
            quadrato in basso a destra di D9: &#123;1&#125; in D9, F9.
          </li>
        </ul>
        <p class="caption">
          Le due celle "testimone" del pattern (D3 e F9, in secondario)
          sono quelle con cui D9 forma le coppie da 2 occorrenze.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Se D9 fosse 1, allora D3 e F9 diventerebbero automaticamente
          non-1 e lo schema collasserebbe in una bi-value grave a doppia
          soluzione. Poiché lo schema ha soluzione unica,
          <strong>1</strong> viene rimosso da D9 che resta con
          &#123;6, 9&#125;.
        </p>
      </div>

      <div>
        <h3>Quando ha senso cercarlo</h3>
        <p>
          BUG è una tecnica <em>endgame</em>: non può applicarsi su uno
          schema poco riempito perché richiede che tutte le celle vuote
          tranne una siano bi-valore. Il solver di SudokuLab lo pesa con
          <code>NP</code> (percentuale di celle già piazzate), proprio
          perché è rilevante solo nella fase finale.
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
      code {
        background: rgba(255, 255, 255, 0.08);
        padding: 1px 6px;
        border-radius: 3px;
      }
    `,
  ],
})
export class BugInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale: puzzle proposto per il didattico.
    schema:
      '000000002400000190037800065070038000004060300000790040580003910019000008200000000',

    // Snapshot immediatamente prima del passo 37 (applicazione di BUG).
    // Lo stato ha 18 celle vuote: tutte bi-valore tranne D9 che ha 3
    // candidati {1, 6, 9}. Il valore 1 compare esattamente 2 volte nei
    // tre gruppi di D9 (riga D, colonna 9, box 6) → bug-value. Rimuovendo
    // 1 da D9 si scardina la bi-value grave.
    values:
      '005314782428657193137829465070438000804160300300790840586273914719546238243981000',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = D9, la cella "trivalente" da cui si rimuove 1.
    // - cell2 (secondario) = D3 e F9, le due celle "testimone" del
    //                        bug-value: insieme a D9 formano le coppie
    //                        da due occorrenze di 1 in riga D, colonna 9
    //                        e box 6.
    highlights: `cell D9
cell2 D3, F9`,
  };
}
