import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Unique Rectangle.
 *
 * Tecnica di uniqueness: sfrutta il vincolo di soluzione unica del puzzle
 * per evitare il "deadly pattern" (quattro celle ai vertici di un rettangolo,
 * su 2 righe × 2 colonne × 2 box, tutte con gli stessi 2 candidati — uno
 * schema del genere avrebbe almeno 2 soluzioni).
 */
@Component({
  selector: 'unique-rectangle-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>L'idea: evitare il "deadly pattern"</h3>
        <p>
          Consideriamo quattro celle <strong>ai vertici di un rettangolo</strong>:
          due righe, due colonne, distribuite in esattamente due quadrati
          (cioè le due righe stanno nella stessa "banda" di 3 righe, e le
          colonne nella stessa banda di 3 colonne). Se tutte e quattro
          queste celle avessero gli stessi due candidati
          <strong>&#123;X, Y&#125;</strong>, la soluzione del puzzle non
          sarebbe unica: i due valori potrebbero scambiarsi tra i vertici
          generando <em>almeno due</em> soluzioni valide (il cosiddetto
          <em>deadly pattern</em>).
        </p>
        <p>
          Dato che SudokuLab lavora su schemi garantiti a soluzione unica,
          il deadly pattern è impossibile: ogni volta che siamo a un passo
          dal crearlo, uno dei vertici deve <em>necessariamente</em>
          assumere un valore diverso da X o Y. Questa osservazione è ciò
          che Unique Rectangle sfrutta per rimuovere candidati.
        </p>
      </div>

      <div>
        <h3>Tipo 1 — tre celle sono &#123;X, Y&#125;, la quarta ha "extra"</h3>
        <p>
          Se in un rettangolo <strong>tre</strong> vertici hanno esattamente
          &#123;X, Y&#125; e il <strong>quarto</strong> vertice ha
          &#123;X, Y&#125; più uno o più candidati "extra", allora quel
          quarto vertice non può finire a X né a Y (altrimenti si
          formerebbe il deadly pattern). Quindi da quel vertice
          <strong>si rimuovono entrambi i candidati X e Y</strong> e
          restano solo gli extra.
        </p>
      </div>

      <div>
        <h3>Tipo 2 — due celle sono &#123;X, Y&#125;, due hanno &#123;X, Y, Z&#125;</h3>
        <p>
          Se due vertici opposti di una riga sono bivalore
          &#123;X, Y&#125; e gli altri due (sull'altra riga) hanno
          <em>identici</em> candidati &#123;X, Y, Z&#125;, allora Z dovrà
          per forza occupare uno dei due vertici "estesi" (per rompere il
          deadly pattern). Di conseguenza <strong>Z può essere rimosso da
          tutte le celle che vedono contemporaneamente quei due vertici
          estesi</strong>.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — Unique Rectangle Tipo 1 su &#123;1, 3&#125;</h3>
        <p class="caption">
          Stato al passo in cui il solver applica Unique Rectangle. I
          quattro vertici del rettangolo sono <strong>A3</strong>,
          <strong>A6</strong>, <strong>C3</strong>, <strong>C6</strong>
          (righe A e C × colonne 3 e 6, distribuiti su quadrato 1 e
          quadrato 2 — due box). Tre di loro —
          <strong>A3</strong>, <strong>C3</strong>, <strong>C6</strong>
          (in primario) — hanno esattamente candidati &#123;1, 3&#125;.
          Il quarto vertice <strong>A6</strong> (in secondario) ha
          candidati &#123;1, 3, 4&#125;: l'"extra" è 4.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Se A6 fosse 1 o 3, le quattro celle avrebbero tutte
          &#123;1, 3&#125; e i due valori si potrebbero scambiare lungo
          il rettangolo producendo due soluzioni. Visto che il puzzle ha
          soluzione unica, A6 <em>deve</em> essere l'extra: da A6 vengono
          rimossi <strong>1 e 3</strong>, lasciando un naked single
          &#123;4&#125; che il passo successivo valorizzerà.
        </p>
      </div>

      <div>
        <h3>Vincoli da rispettare</h3>
        <ul>
          <li>
            Le 4 celle devono stare su <strong>2 righe × 2 colonne</strong>
            e in <strong>esattamente 2 quadrati</strong> (uno contenente le
            due celle di una coppia di colonne, l'altro le due celle
            dell'altra coppia). Se stessero in 4 quadrati diversi il
            vincolo di uniqueness non si propagherebbe.
          </li>
          <li>
            L'algoritmo è valido <em>solo</em> se lo schema ha soluzione
            unica. In SudokuLab tutti gli schemi del catalogo lo sono, ma
            su schemi di provenienza incerta questa tecnica va usata con
            cautela.
          </li>
        </ul>
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
export class UniqueRectangleInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale: puzzle proposto per il didattico (definisce le celle fisse).
    schema:
      '700200000006090150400000000030705090008000500010608020000000005089010700000002006',

    // Snapshot immediatamente prima del passo 35 (applicazione di Unique
    // Rectangle). Include i dinamici piazzati dai passi precedenti: lo stato
    // esibisce quattro celle ai vertici di un rettangolo su righe A/C e
    // colonne 3/6, distribuite in box 1 e box 2:
    //   - A3=[1,3], C3=[1,3], C6=[1,3]   (tre celle bi-valore)
    //   - A6=[1,3,4]                     (il vertice "esteso" con 4)
    // Per evitare il deadly pattern su {1,3}, A6 perde 1 e 3 → naked single {4}.
    values:
      '700200600826097150400060270634725891278109560915608027062070005089016702047002006',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = i tre vertici bi-valore {1,3} (A3, C3, C6):
    //                        sono le celle "rigide" del deadly pattern.
    // - cell2 (secondario) = il quarto vertice A6, dal quale vengono
    //                        rimossi 1 e 3 per impedire la doppia soluzione.
    // I quattro vertici del rettangolo sono tutti evidenziati (in due colori
    // diversi) e delineano visivamente la forma.
    highlights: `cell A3, C3, C6
cell2 A6`,
  };
}
