import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Couples (Couples over groups).
 *
 * Tre celle bivalore collegate in catena che permettono di eliminare un valore
 * da celle che "vedono" due punte della catena:
 *
 *   XY -- YZ           XY -- YZ
 *    |         oppure          |
 *    |                         |
 *   XZ     -Z          -X     ZX
 *
 * È la formulazione "in-group" dell'XY-Wing: le due celle XY e YZ stanno nello
 * stesso gruppo (riga/colonna/quadrato), mentre XZ sta in un altro gruppo
 * comune con una delle due.
 */
@Component({
  selector: 'couples-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Couples individua una catena di <strong>tre celle bivalore</strong>
          con candidati del tipo <strong>&#123;X, Y&#125;</strong>,
          <strong>&#123;Y, Z&#125;</strong> e <strong>&#123;X, Z&#125;</strong>
          (tre cifre che si "scambiano" a due a due tra le tre celle). Perché
          l'algoritmo scatti:
        </p>
        <ul>
          <li>
            due delle tre celle — chiamiamole <em>XY</em> e <em>YZ</em> —
            condividono un gruppo (riga, colonna o quadrato), e
            <em>condividono</em> esattamente un candidato: <strong>Y</strong>;
          </li>
          <li>
            la terza cella — <em>XZ</em> — condivide un gruppo diverso con
            <em>XY</em> (oppure con <em>YZ</em>) e ha candidati
            &#123;X, Z&#125;.
          </li>
        </ul>
        <p>
          In questa configurazione il valore <strong>Z</strong> può essere
          rimosso da ogni cella che <em>vede contemporaneamente</em>
          <em>XZ</em> e <em>YZ</em> (cioè che sta in un gruppo comune alle due).
          Simmetricamente, scambiando il ruolo dei "lati" della catena,
          <strong>X</strong> può essere rimosso dalle celle che vedono insieme
          <em>XZ</em> e <em>XY</em>.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Partiamo dalla catena <em>XY — YZ</em> (stesso gruppo) e dalla
          terza cella <em>XZ</em>. La cella <em>XY</em> varrà X oppure Y:
        </p>
        <ul>
          <li>
            se <em>XY = Y</em>, allora nel gruppo comune
            <em>YZ</em> non può essere Y → <em>YZ = Z</em>;
          </li>
          <li>
            se <em>XY = X</em>, allora in un altro gruppo comune
            <em>XZ</em> non può essere X → <em>XZ = Z</em>.
          </li>
        </ul>
        <p>
          In entrambi i casi <strong>Z</strong> finisce o in <em>XZ</em> o
          in <em>YZ</em>: non può quindi stare in alcuna cella che le veda
          entrambe.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — catena (1, 2, 3) in colonna 1</h3>
        <p class="caption">
          Nello stato qui sotto la <strong>colonna 1</strong> contiene tre
          celle bivalore: <strong>A1</strong> = &#123;1, 2&#125;,
          <strong>D1</strong> = &#123;2, 3&#125; e <strong>B1</strong> =
          &#123;1, 3&#125; (primario). A1 e D1 sono nello stesso gruppo
          (colonna 1) e condividono solo il valore Y = 2 → X = 1, Z = 3.
          B1 è la terza cella: sta ancora in colonna 1 con A1 (in un gruppo
          diverso: il quadrato 1) e ha proprio candidati &#123;X, Z&#125; =
          &#123;1, 3&#125;.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Effetto (secondario): la cella <strong>C1</strong> vede
          contemporaneamente <em>B1</em> (XZ) e <em>D1</em> (YZ) —
          entrambe in colonna 1 con C1. Quindi da C1 (candidati
          &#123;1, 2, 3, 9&#125;) il valore <strong>3</strong> può essere
          rimosso: C1 diventa &#123;1, 2, 9&#125;.
        </p>
      </div>

      <div>
        <h3>Rapporto con XY-Wing</h3>
        <p>
          Couples e XY-Wing descrivono lo stesso tipo di catena; cambia
          solo il modo di riconoscerla. Couples parte da <em>due</em> celle
          bivalore nello stesso gruppo e poi cerca la terza; XY-Wing parte
          da un "pivot" bivalore e poi cerca due "wings" collegate al
          pivot. Couples ha priorità più bassa nel solver di SudokuLab
          (viene tentato prima): ogni pattern che trova è in pratica un
          sottoinsieme di quelli rilevabili da XY-Wing, quando una delle
          wings condivide un gruppo col pivot.
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
    `,
  ],
})
export class CouplesInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Stato costruito ad hoc: esibisce in colonna 1 tre celle bivalore
    // (A1={1,2}, D1={2,3}, B1={1,3}) che formano la catena Couples.
    //
    // Valori fissati:
    // - Riga A: A4=3, A7=9
    // - Riga B: B5=2, B6=9
    // - Riga C: C6=4
    // - Riga D: D4=1, D8=9
    // - Riga E: E1=4, E6=7
    // - Riga F: F1=5
    // - Riga G: G1=6, G5=1
    // - Riga H: H1=7
    // - Riga I: I1=8
    //
    // Candidati risultanti delle celle chiave:
    // - A1={1,2}, B1={1,3}, D1={2,3}: la terna Couples.
    // - C1={1,2,3,9}: cella impattata (perde 3).
    //
    // Nota: il solver su questo stato applicherebbe prima OneCellForValue
    // (C1=9 è hidden single in col 1), quindi Couples non scatta in pratica
    // — lo schema è pensato solo per mostrare visivamente il pattern.
    schema:
      '000300900000029000000004000000100090400007000500000000600010000700000000800000000',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = le tre celle che formano la catena (A1, B1, D1).
    // - cell2 (secondario) = la cella impattata (C1, da cui si rimuove 3).
    // - col 1              = il gruppo comune in cui vive la catena.
    highlights: `cell A1, B1, D1
cell2 C1
col 1`,
  };
}
