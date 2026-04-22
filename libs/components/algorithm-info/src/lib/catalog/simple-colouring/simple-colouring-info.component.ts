import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Simple Colouring (Single Chains).
 *
 * Per un valore V si costruiscono tutte le "coppie coniugate" (gruppi in cui
 * V può andare solo in 2 celle) e si collegano in una catena. Le celle della
 * catena si colorano alternatamente con 2 colori. Due regole classiche:
 * - color-wrap: due celle dello stesso colore nello stesso gruppo → quel
 *   colore è necessariamente FALSE → V si rimuove da tutte le celle di
 *   quel colore;
 * - color-trap: una cella esterna alla catena che "vede" entrambi i colori →
 *   V si rimuove da quella cella.
 */
@Component({
  selector: 'simple-colouring-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>L'idea — coppie coniugate e colorazione alternata</h3>
        <p>
          Fissiamo un valore <strong>V</strong>. In un gruppo (riga, colonna
          o quadrato) dove V può stare <em>esattamente in 2 celle</em>
          abbiamo una <strong>coppia coniugata</strong>: V andrà in una
          delle due, l'altra no. È come una "scelta binaria".
        </p>
        <p>
          Se due coppie coniugate condividono una cella, si collegano in
          una catena. Proseguendo si ottiene una struttura di celle
          collegate, tutte legate alla scelta "V qui sì / V qui no". La
          catena si può colorare con <strong>due colori alternati</strong>:
          ogni arco tra celle della catena corrisponde a una coppia
          coniugata, e i due estremi dell'arco prendono colori diversi
          (proprio come un grafo bipartito). Il significato: se una cella
          di colore A contiene V, allora tutte le altre celle di colore A
          nella stessa catena contengono V, e tutte quelle di colore B no
          (e viceversa).
        </p>
      </div>

      <div>
        <h3>Color-wrap — eliminazione dentro la catena</h3>
        <p>
          Se due celle <em>dello stesso colore</em> finiscono nello stesso
          gruppo (riga/colonna/quadrato), allora quel colore non può
          essere "on" (avrebbe due V nello stesso gruppo, il che è
          proibito). Quindi quel colore è necessariamente FALSE e V può
          essere rimosso da <strong>tutte</strong> le celle di quel
          colore.
        </p>
      </div>

      <div>
        <h3>Color-trap — eliminazione fuori dalla catena</h3>
        <p>
          Una cella esterna alla catena che vede almeno una cella di
          <em>ciascun</em> colore non può contenere V: in uno dei due
          scenari (A on / B on) V è in una delle celle che essa vede, nel
          secondo è nell'altra. In entrambi i casi la cella esterna
          "collide" con V.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — color-wrap sul valore 2</h3>
        <p class="caption">
          Stato al passo in cui il solver applica Simple Colouring. Per
          il valore <strong>2</strong> si forma una catena di 8 celle
          collegate da coppie coniugate (righe, colonne e quadrati in cui
          2 ha solo 2 posizioni):
        </p>
        <ul class="reasons">
          <li>
            <strong>Colore A</strong> (in primario): <strong>A2</strong>,
            <strong>B7</strong>, <strong>I9</strong>;
          </li>
          <li>
            <strong>Colore B</strong> (in secondario): <strong>A9</strong>,
            <strong>G2</strong>, <strong>B3</strong>, <strong>G7</strong>,
            <strong>I3</strong>.
          </li>
        </ul>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Due celle dello stesso colore B, <strong>G2</strong> e
          <strong>I3</strong>, appartengono allo <em>stesso quadrato</em>
          (box in basso a sinistra). Quindi "B on" produrrebbe due 2 nel
          medesimo box — impossibile. Di conseguenza B è FALSE: il
          candidato 2 viene rimosso da <strong>tutte</strong> le celle di
          colore B (A9, G2, B3, G7, I3). Nel caso specifico l'effetto è
          particolarmente forte: quattro di quelle celle restano con un
          unico candidato e diventano naked single, aprendo un forte
          avanzamento.
        </p>
      </div>

      <div>
        <h3>Come riconoscerlo velocemente</h3>
        <p>
          Scegli un valore V. Per ogni gruppo in cui V può andare in
          esattamente due celle disegna mentalmente un arco che le
          unisce. Parti da un nodo, colora alternatamente lungo gli
          archi: se in qualche momento due celle dello stesso colore
          cadono nello stesso gruppo hai un color-wrap. Se una cella
          fuori dalla catena vede almeno un nodo di ciascun colore hai
          un color-trap.
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
export class SimpleColouringInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale: puzzle proposto per il didattico.
    schema:
      '000900000000360007300002006050109700007000800001804020600700009400058000000006000',

    // Snapshot immediatamente prima del passo 45 (applicazione di Simple
    // Colouring). Per il valore 2 si forma una catena di 8 celle con due
    // colori alternati; due celle di colore B (G2 e I3) condividono il
    // box in basso a sinistra → color-wrap, tutte le celle di colore B
    // perdono il candidato 2.
    values:
      '106947530590361007374582916853129764247635891961874325600713009419258673730496100',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = colore A della catena: A2, B7, I9. Sono le
    //                        celle "opposte" a quelle da cui si rimuove V.
    // - cell2 (secondario) = colore B della catena: A9, G2, B3, G7, I3.
    //                        Sono le celle impattate: perdono tutte il
    //                        candidato 2. In particolare A9/G2/B3/G7
    //                        diventano naked single, I3 resta con {5, 8}.
    highlights: `cell A2, B7, I9
cell2 A9, G2, B3, G7, I3`,
  };
}
