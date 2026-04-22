import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

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
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Try Number interviene <strong>solo come ultima risorsa</strong>,
          quando nessun altro algoritmo logico del catalogo produce più
          progressi sullo stato corrente. È l'equivalente strutturato del
          "prova e vedi" manuale: si sceglie una cella, si <em>diramano</em>
          N schemi paralleli (uno per candidato) e si prosegue con la
          risoluzione su ciascun ramo. I rami incompatibili con i vincoli
          si auto-eliminano in errore; il ramo che si completa senza
          contraddizioni contiene la soluzione.
        </p>
        <p>
          Per questo motivo Try Number ha la <strong>priorità più alta
          (100)</strong> del catalogo: viene tentato <em>dopo</em>
          qualunque altra tecnica. Ogni applicazione conta come "passo
          try-algorithm" (visibile come badge <code>T<em>n</em></code>
          sul catalogo), ed è l'indicatore più netto del livello di
          difficoltà dello schema.
        </p>
      </div>

      <div>
        <h3>Come sceglie la cella — MRV + Degree</h3>
        <p>
          Per limitare l'esplosione combinatoria, Try Number sceglie la
          cella di dirama con un'euristica a due livelli:
        </p>
        <ul>
          <li>
            <strong>MRV (Minimum Remaining Values)</strong>: tra tutte le
            celle ancora vuote, prende quelle con il <em>minimo</em>
            numero di candidati (tipicamente 2). Meno opzioni = meno
            rami da esplorare.
          </li>
          <li>
            <strong>Degree</strong> (tie-break): a parità di candidati,
            preferisce la cella che <em>vede</em> più celle vuote (riga
            + colonna + quadrato). Una cella con alto degree, una volta
            valorizzata, propaga i suoi vincoli a più celle, facendo
            progredire la risoluzione il più possibile all'interno del
            ramo.
          </li>
        </ul>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — split sulla cella H5</h3>
        <p class="caption">
          Stato al passo in cui il solver applica Try Number. Ci sono
          molte celle con 2 candidati (MRV = 2). L'euristica Degree
          seleziona <strong>H5</strong> (in primario) con candidati
          &#123;4, 6&#125;: è la cella bi-valore che "vede" il maggior
          numero di celle vuote nei suoi gruppi.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Lo schema si dirama in due copie: nel ramo A H5 = 4, nel ramo B
          H5 = 6. Ciascuno prosegue indipendentemente con tutti gli
          algoritmi del catalogo. Se uno dei due incontra una
          contraddizione (cella vuota con zero candidati o gruppo con
          due valori uguali) viene scartato; l'altro continua fino alla
          soluzione.
        </p>
      </div>

      <div>
        <h3>Peso nella difficoltà</h3>
        <p>
          Il factor <code>+400+(4*NU*NEP)</code> è il più alto del
          catalogo. La componente variabile (<code>NEP</code> alto a
          inizio schema, basso alla fine) penalizza particolarmente i
          <em>try</em> che avvengono all'inizio del processo — un segno
          che gli algoritmi logici non sono bastati neanche per
          decantare. Un Try Number al 5% dello schema è considerevolmente
          più costoso di uno al 90%, dove resta solo un pugno di celle
          ancora da fissare.
        </p>
      </div>

      <div>
        <h3>Alternative e note pratiche</h3>
        <p>
          Per chi risolve a mano, "arrivare a Try Number" equivale a
          dichiarare che nessuna tecnica nota permette di proseguire.
          SudokuLab usa Try Number come <em>backstop</em>: garantisce
          che qualunque schema a soluzione unica venga risolto in tempo
          finito, anche quando richiede una catena di ragionamenti
          condizionali (forcing chains, nice loops, ecc.) non ancora
          implementati nel catalogo.
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
      code {
        background: rgba(255, 255, 255, 0.08);
        padding: 1px 6px;
        border-radius: 3px;
      }
    `,
  ],
})
export class TryNumberInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale: puzzle proposto per il didattico.
    schema:
      '700030012000008034000400800005802060800000001060305200004009000180700000930050008',

    // Snapshot immediatamente prima del passo 21 (applicazione di Try Number).
    // Lo stato ha molte celle bi-valore e nessun altro algoritmo del catalogo
    // può progredire senza biforcazione. L'euristica MRV + Degree sceglie H5
    // (candidati {4, 6}) come cella di split.
    values:
      '748036012000008034003400800305802460800000351460305280004089003180703000930050008',

    // Evidenziazioni didattiche:
    // - cell (primario) = H5, la cella su cui il solver "tenta" la dirama.
    highlights: `cell H5`,
  };
}
