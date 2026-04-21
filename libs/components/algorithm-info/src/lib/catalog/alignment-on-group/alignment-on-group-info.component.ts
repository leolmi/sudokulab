import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Alignment On Group.
 *
 * È la tecnica classicamente chiamata "pointing" (box → linea) e "claiming"
 * (linea → box). In un gruppo un valore può comparire solo in celle che
 * appartengono tutte anche ad un altro gruppo "ortogonale": allora in
 * quest'ultimo il valore può essere rimosso da ogni cella che non fa parte
 * dell'intersezione.
 */
@Component({
  selector: 'alignment-on-group-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Si considera un gruppo <strong>A</strong> (riga, colonna o
          quadrato) e un valore <strong>V</strong>. Si guardano le celle di
          A in cui V è ancora candidato: se sono <em>tutte</em> contenute
          anche in un secondo gruppo <strong>B</strong> — ad esempio sono
          tutte nello stesso quadrato, o tutte nella stessa riga/colonna —
          allora V, quando finirà in A, dovrà finire in una di quelle celle
          comuni, quindi <strong>anche</strong> dentro B.
        </p>
        <p>Conseguenza: in B si può rimuovere V da ogni cella che non appartiene ad A.</p>
        <p>Questa logica cattura due sotto-casi classici:</p>
        <ul>
          <li>
            <strong>Pointing</strong>: in un <em>quadrato</em> V è allineato
            su una riga o su una colonna → si elimina V dalle altre celle
            di quella riga/colonna.
          </li>
          <li>
            <strong>Claiming</strong> (o box-line reduction): in una
            <em>riga</em> o <em>colonna</em> V è confinato dentro un solo
            quadrato → si elimina V dalle altre celle di quel quadrato.
          </li>
        </ul>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — claiming del 6 dalla colonna 1 al quadrato 1</h3>
        <p class="caption">
          In <strong>colonna 1</strong> il candidato <strong>6</strong>
          rimane possibile solo nelle celle <strong>B1</strong> e
          <strong>C1</strong> (evidenziate in primario). Entrambe stanno nel
          quadrato in alto a sinistra (<em>quadrato 1</em>). Quindi il 6,
          quando finirà in colonna 1, finirà per forza in una delle due, e
          dentro il quadrato 1 non può comparire altrove.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="400">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Effetto concreto: nella cella <strong>B3</strong>
          (<em>secondario</em>) il candidato 6 viene rimosso, perché B3 sta
          nel quadrato 1 ma non in colonna 1 — e il 6 del quadrato 1 è
          già "claimato" dalla colonna.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Ogni riga, colonna e quadrato deve contenere V esattamente una
          volta. Se in un gruppo A tutte le posizioni dove V è ancora
          possibile stanno anche in un secondo gruppo B, allora la collocazione
          di V in A è sicuramente anche una cella di B. Dunque V non può
          stare in nessun'altra cella di B.
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
export class AlignmentOnGroupInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale del puzzle (schema MEDIUM dal catalogo): risolvendolo il
    // solver applica AlignmentOnGroup al passo 5 con il valore 6 allineato
    // in colonna 1 (celle B1 e C1, entrambe nel quadrato 1).
    schema:
      '000000600000940000038100004067000000050800010000030900200000081003080006040000720',

    // Snapshot immediatamente prima del passo: include i 5 valori dinamici
    // piazzati ai passi precedenti. Senza questo stato il pattern non è
    // leggibile nei candidati iniziali.
    values:
      '000000600000940100038100004067000800050800010080030960200000081003080006840000720',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = le celle che generano l'allineamento in col 1
    //                        (B1, C1) e che fissano dove potrà finire il 6.
    // - cell2 (secondario) = la cella del quadrato 1 da cui il 6 viene
    //                        rimosso (B3).
    // - col 1 / sqr 1      = i due gruppi coinvolti (allineamento e
    //                        destinazione dell'eliminazione).
    highlights: `cell B1, C1
cell2 B3
col 1
sqr 1`,
  };
}
