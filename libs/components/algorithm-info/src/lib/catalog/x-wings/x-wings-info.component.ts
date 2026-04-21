import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo X-Wings.
 *
 * X-Wings si applica quando un valore V compare come candidato in **esattamente
 * due celle** su due righe distinte, e queste quattro celle sono allineate sulle
 * **stesse due colonne**. In questa configurazione V può essere rimosso da tutte
 * le altre celle di quelle due colonne (e viceversa scambiando righe con colonne).
 */
@Component({
  selector: 'x-wings-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Consideriamo un valore <strong>V</strong>. X-Wings vede il pattern
          quando:
        </p>
        <ul>
          <li>
            in <strong>due righe</strong> diverse V può stare in
            <em>esattamente</em> due celle;
          </li>
          <li>
            le due posizioni nelle due righe si trovano sulle
            <strong>stesse due colonne</strong>.
          </li>
        </ul>
        <p>
          Le quattro celle formano un rettangolo ("X-Wing"). Poiché V deve stare
          in entrambe le righe e solo in quelle due colonne, V non può comparire
          in nessun'altra cella di quelle colonne.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — X-Wing per il valore 1</h3>
        <p class="caption">
          Stato dello schema al passo in cui il solver applica l'algoritmo. Il
          candidato <strong>1</strong> è confinato a due sole celle in
          <strong>colonna 3</strong> (D3, I3) e a due sole celle in
          <strong>colonna 4</strong> (D4, I4). Le quattro celle, evidenziate in
          primario, sono allineate sulle stesse due righe (D e I) e formano il
          rettangolo dell'X-Wing. La cella in secondario (<strong>D5</strong>) è
          quella su cui il solver, per effetto dell'algoritmo, rimuove il
          candidato 1.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="400">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Dato il pattern, il valore 1 può essere <strong>eliminato</strong> da
          ogni altra cella delle righe <strong>D</strong> e <strong>I</strong>:
          in quelle righe l'1 può finire solo in uno dei quattro vertici del
          rettangolo.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Le colonne 3 e 4 devono ciascuna contenere un 1. Se entrambe lo hanno
          solo nelle righe D e I, una delle due colonne prende l'1 in riga D e
          l'altra in riga I (sono le uniche due combinazioni possibili). In ogni
          caso le righe D e I contengono già i loro 1 nei vertici, quindi non
          possono contenerne altri.
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
export class XWingsInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale del puzzle (schema "9x9_25num_MEDIUM_(614457223)" preso da
    // documents/catalog.json): definisce le celle fisse, immutabili.
    schema:
      '503020000900308000002000045090004000048000720000200010870000100000705002000090507',

    // Stato della board immediatamente prima del passo in cui il solver applica
    // X-Wings. Include i valori dinamici piazzati dagli algoritmi precedenti: da
    // questo snapshot il preview ricalcola i candidati, così il pattern (1
    // confinato a D3/I3 in colonna 3 e a D4/I4 in colonna 4) è direttamente
    // leggibile sulla griglia.
    values:
      '503427000904358270782900345290004050048500720050200010875602100039705002420090507',

    // Evidenziazioni didattiche (convenzione invertita rispetto al solver):
    // - cell  (primario)   = i quattro vertici del rettangolo X-Wing, cioè il
    //                        pattern che si vuole far notare all'utente.
    // - cell2 (secondario) = tutte le celle impattate dall'applicazione, cioè
    //                        quelle da cui il candidato 1 viene rimosso. Non
    //                        solo la prima riportata dal solver in descLines.
    highlights: `cell D3, I3, D4, I4
  cell2 D5, I6`,
  };
}
