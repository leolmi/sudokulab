import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo One Cell For Value.
 *
 * È la tecnica più elementare: all'interno di un gruppo (riga, colonna o
 * quadrato) esiste una sola cella in grado di ospitare un determinato valore.
 * In quella cella si può piazzare direttamente il valore.
 */
@Component({
  selector: 'one-cell-for-value-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Si sceglie un gruppo (una <strong>riga</strong>, una
          <strong>colonna</strong> o un <strong>quadrato</strong>) e un valore
          <strong>V</strong> che ancora manca nel gruppo. Se, scorrendo tutte
          le celle vuote del gruppo, <strong>una sola</strong> può
          effettivamente contenere V — perché nelle altre V è già presente
          sulla loro riga, sulla loro colonna o nel loro quadrato — allora in
          quella cella si può piazzare V.
        </p>
        <p>
          È la tecnica più immediata: non richiede di ragionare sui candidati
          della singola cella, ma solo di contare dove un certo valore può
          ancora finire dentro un gruppo.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — valore 7 in riga B</h3>
        <p class="caption">
          Nella riga <strong>B</strong> il valore 7 manca ancora. Le celle
          vuote sono <strong>B2</strong>, <strong>B3</strong>,
          <strong>B5</strong> e <strong>B6</strong>: tre di esse
          (<em>evidenziate in secondario</em>) hanno il 7 già bloccato dalla
          loro colonna o dal loro quadrato. Resta soltanto
          <strong>B3</strong> (<em>primario</em>), dove il 7 può essere
          piazzato.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="400">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          In dettaglio: in <strong>B2</strong> il 7 è escluso dalla colonna 2
          (F2 contiene già 7); in <strong>B5</strong> il 7 è escluso dal
          quadrato centrale (C6 contiene già 7); in <strong>B6</strong> il 7
          è escluso dalla colonna 6 (C6 contiene già 7). Quindi B3 è l'unica
          posizione possibile.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Ogni gruppo del sudoku deve contenere tutti i valori da 1 a 9
          esattamente una volta. Se in un gruppo un valore può stare solo in
          una cella, quella cella <strong>deve</strong> contenerlo: non c'è
          altra collocazione possibile.
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
export class OneCellForValueInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale del puzzle (schema "9x9_23num_EASY_(771909447)" preso da
    // documents/catalog.json): il solver applica OneCellForValue già al primo
    // passo sulla cella B3 con il valore 7.
    schema:
      '000100040400900126000007900040000531580000000070600000000009060002750000000002000',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = la cella unica in cui il valore può essere
    //                        piazzato (B3, dove il solver piazza il 7).
    // - cell2 (secondario) = le altre celle vuote del gruppo (riga B) in cui
    //                        lo stesso valore è bloccato da colonna o quadrato.
    highlights: `cell B3
cell2 B2, B5, B6`,
  };
}
