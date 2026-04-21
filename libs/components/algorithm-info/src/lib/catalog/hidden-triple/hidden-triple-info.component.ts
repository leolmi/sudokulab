import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Hidden Triple.
 *
 * Tre valori che in un gruppo possono stare solo in tre specifiche celle:
 * quelle tre celle devono contenere esattamente quei tre valori, quindi tutti
 * gli altri candidati presenti in quelle celle possono essere rimossi.
 *
 * È la controparte "hidden" del Naked Triple: invece di partire dalle celle e
 * cercare un'unione ristretta di candidati, si parte dai valori e si guarda
 * dove possono essere collocati nel gruppo.
 */
@Component({
  selector: 'hidden-triple-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Si prende un gruppo (riga, colonna o quadrato) e si cercano
          <strong>tre valori</strong> <strong>X</strong>,
          <strong>Y</strong> e <strong>Z</strong> che nel gruppo hanno
          complessivamente <em>solo tre posizioni possibili</em>, ovvero tre
          celle <strong>c₁</strong>, <strong>c₂</strong> e
          <strong>c₃</strong>. Nessun altro posto del gruppo può ospitare
          X, Y o Z: devono andare per forza lì.
        </p>
        <p>
          Quelle tre celle possono contenere <strong>anche</strong> altri
          candidati (ecco perché si dice "hidden"): non lo si vede
          direttamente guardando i candidati delle singole celle, bisogna
          ragionare sui valori e dove possono stare. Una volta individuato
          il pattern, i candidati diversi da X, Y, Z possono essere rimossi
          da c₁, c₂ e c₃.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — terna (1, 2, 3) in riga A</h3>
        <p class="caption">
          Nello stato qui sotto, nella <strong>riga A</strong> le cifre
          <strong>1</strong>, <strong>2</strong> e <strong>3</strong>
          possono stare <em>solo</em> nelle celle
          <strong>A1</strong>, <strong>A2</strong> e <strong>A3</strong>
          (in primario): in A8 e A9 il 1 è escluso dalla colonna 8 (B8=1), il
          2 è escluso dalla colonna 9 (B9=2) e il 3 è escluso dal quadrato in
          alto a destra (C7=3). Restano come posizioni libere solo le prime
          tre celle.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="400">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          A1, A2 e A3 mostrano oggi i candidati &#123;1, 2, 3, 8, 9&#125;: i
          primi tre sono il pattern nascosto, gli altri (8 e 9) vanno rimossi.
          Dopo l'applicazione dell'algoritmo quelle tre celle avranno
          candidati &#123;1, 2, 3&#125;, diventando di fatto un naked triple:
          il passo successivo potrà quindi rimuovere 1, 2 e 3 dalle altre
          celle della riga (o di altri gruppi comuni alle tre celle).
        </p>
        <p class="caption">
          <em>Nota didattica</em>: lo schema qui sotto è uno stato parziale
          costruito apposta per isolare il pattern. Nel catalogo dei puzzle
          reali di SudokuLab Hidden Triple non viene di norma raggiunto,
          perché algoritmi più semplici (One Cell For Value, Twins, Naked
          Triple…) risolvono gli schemi prima che si arrivi a questo livello.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Ogni gruppo del sudoku contiene ciascuna cifra esattamente una
          volta. Se tre cifre X, Y, Z possono finire solo in tre celle
          comuni, la corrispondenza è obbligata: quelle tre celle
          conterranno esattamente quelle tre cifre (in un ordine qualsiasi).
          Nessun altro valore può quindi occuparle.
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
export class HiddenTripleInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Stato parziale costruito apposta per il didattico: NON è un puzzle a
    // soluzione unica, è solo una fotografia di griglia valida (nessun
    // conflitto riga/colonna/quadrato) che esibisce in modo netto il pattern
    // Hidden Triple in riga A.
    //
    // Valori fissati:
    // - riga A: A4=4, A5=5, A6=6, A7=7
    // - riga B: B1=4, B2=5, B3=6, B8=1, B9=2
    // - riga C: C7=3
    //
    // Effetti sui candidati:
    // - A1/A2/A3 hanno candidati {1,2,3,8,9} (5 valori ciascuno);
    // - A8/A9 hanno candidati {8,9}: 1, 2, 3 sono esclusi dal quadrato 3
    //   (B8=1, B9=2, C7=3) e dalle colonne 8/9.
    // Quindi i valori 1, 2 e 3 in riga A possono andare SOLO in A1, A2, A3:
    // hidden triple.
    schema:
      '000456700456000012000000300000000000000000000000000000000000000000000000000000000',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = le tre celle della terna nascosta (A1, A2, A3).
    //                        Sono anche le celle impattate dall'algoritmo:
    //                        da ognuna vanno rimossi i candidati 8 e 9.
    // - row A              = il gruppo in cui vive il pattern.
    highlights: `cell A1, A2, A3
row A`,
  };
}
