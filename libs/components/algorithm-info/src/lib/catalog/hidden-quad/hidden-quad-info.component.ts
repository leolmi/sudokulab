import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Hidden Quad.
 *
 * Quattro valori che in un gruppo possono stare solo in quattro specifiche
 * celle: quelle quattro celle devono contenere esattamente quei quattro valori,
 * quindi tutti gli altri candidati presenti in quelle celle possono essere
 * rimossi.
 *
 * È la controparte "hidden" del Naked Quad: invece di partire dalle celle e
 * cercare un'unione ristretta di candidati, si parte dai valori e si guarda
 * dove possono essere collocati nel gruppo.
 */
@Component({
  selector: 'hidden-quad-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Si prende un gruppo (riga, colonna o quadrato) e si cercano
          <strong>quattro valori</strong> <strong>W</strong>,
          <strong>X</strong>, <strong>Y</strong> e <strong>Z</strong> che nel
          gruppo hanno complessivamente <em>solo quattro posizioni possibili</em>,
          ovvero quattro celle <strong>c₁</strong>, <strong>c₂</strong>,
          <strong>c₃</strong> e <strong>c₄</strong>. Nessun altro posto del
          gruppo può ospitare W, X, Y o Z: devono andare per forza lì.
        </p>
        <p>
          Quelle quattro celle possono contenere <strong>anche</strong> altri
          candidati (ecco perché si dice "hidden"): non lo si vede
          direttamente guardando i candidati delle singole celle, bisogna
          ragionare sui valori e dove possono stare. Una volta individuato
          il pattern, i candidati diversi da W, X, Y, Z possono essere
          rimossi da c₁, c₂, c₃ e c₄.
        </p>
        <p>
          È l'estensione diretta di <em>Hidden Triple</em> a quattro valori:
          più raro, perché richiede di trovare contemporaneamente quattro
          cifre "compatte" nello stesso gruppo.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — quaterna (1, 2, 3, 4) in riga A</h3>
        <p class="caption">
          Nello stato qui sotto, nella <strong>riga A</strong> le cifre
          <strong>1</strong>, <strong>2</strong>, <strong>3</strong> e
          <strong>4</strong> possono stare <em>solo</em> nelle celle
          <strong>A1</strong>, <strong>A2</strong>, <strong>A3</strong> e
          <strong>A4</strong> (in primario):
        </p>
        <ul class="reasons">
          <li>l'1 è escluso dal quadrato in alto a destra (B7=1) e quindi da A7, A8, A9;</li>
          <li>il 2 è escluso dalla colonna 9 (B9=2) e dal quadrato in alto a destra, quindi da A7, A8, A9;</li>
          <li>il 3 è escluso dalla colonna 7 (C7=3) e dal quadrato in alto a destra, quindi da A7, A8, A9;</li>
          <li>il 4 è escluso dalla colonna 8 (C8=4) e dal quadrato in alto a destra, quindi da A7, A8, A9.</li>
        </ul>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          A1, A2, A3 e A4 mostrano oggi i candidati &#123;1, 2, 3, 4, 9&#125;:
          i primi quattro sono il pattern nascosto, il 9 è un candidato
          "spurio" che va rimosso da tutte e quattro le celle. Dopo
          l'applicazione dell'algoritmo quelle quattro celle avranno
          candidati &#123;1, 2, 3, 4&#125;, diventando di fatto un naked quad:
          il passo successivo potrà quindi rimuovere 1, 2, 3 e 4 dalle altre
          celle della riga o di altri gruppi comuni alle quattro celle.
        </p>
        <p class="caption">
          <em>Nota didattica</em>: lo schema qui sotto è uno stato parziale
          costruito apposta per isolare il pattern. Nel catalogo dei puzzle
          reali di SudokuLab Hidden Quad non viene praticamente mai raggiunto,
          perché algoritmi più semplici (One Cell For Value, Twins, Naked
          Triple, Hidden Triple…) risolvono gli schemi prima che si arrivi
          a questo livello di concentrazione di candidati.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Ogni gruppo del sudoku contiene ciascuna cifra esattamente una
          volta. Se quattro cifre W, X, Y, Z possono finire solo in quattro
          celle comuni, la corrispondenza è obbligata: quelle quattro celle
          conterranno esattamente quelle quattro cifre (in un ordine
          qualsiasi). Nessun altro valore può quindi occuparle.
        </p>
      </div>

      <div>
        <h3>Come riconoscerlo velocemente</h3>
        <p>
          Parti dai <em>valori</em>, non dalle celle. Per ogni gruppo conta
          in quante celle ciascuna cifra da 1 a 9 può ancora andare. Se
          quattro cifre hanno tutte la stessa ristretta rosa di 4 posizioni
          (o un sottoinsieme di essa), hai un hidden quad. Questa ricerca
          è quella che richiede più attenzione: conviene farla solo dopo
          aver esaurito naked subset e hidden triple.
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
export class HiddenQuadInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Stato parziale costruito apposta per il didattico: NON è un puzzle a
    // soluzione unica, è una fotografia di griglia valida (nessun conflitto
    // riga/colonna/quadrato) che esibisce in modo netto il pattern Hidden Quad
    // in riga A.
    //
    // Valori fissati:
    // - riga A: A5=5, A6=6
    // - riga B: B3=8, B5=7, B7=1, B9=2
    // - riga C: C2=7, C5=8, C7=3, C8=4
    //
    // Effetti sui candidati:
    // - A1/A2/A3/A4 hanno candidati {1,2,3,4,9}: i 5 valori possibili dopo
    //   avere escluso 5,6 (riga) e 7,8 (box 1 o box 2).
    // - A7/A8/A9 hanno candidati {7,8,9}: i valori 1,2,3,4 sono esclusi dal
    //   box in alto a destra (B7=1, B9=2, C7=3, C8=4).
    // Quindi i valori 1,2,3,4 in riga A possono andare SOLO in A1,A2,A3,A4:
    // hidden quad.
    schema:
      '000056000008070102070080340000000000000000000000000000000000000000000000000000000',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = le quattro celle della quaterna nascosta
    //                        (A1, A2, A3, A4). Sono anche le celle impattate:
    //                        da ognuna va rimosso il candidato 9.
    // - row A              = il gruppo in cui vive il pattern.
    highlights: `cell A1, A2, A3, A4
row A`,
  };
}
