import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Turbot Fish.
 *
 * Il pattern si costruisce su tre gruppi concatenati in cui un valore V ha
 * coppie di posizioni (strong link): due gruppi "estremi" (g1, g3) più un
 * gruppo di raccordo (g2) che condivide una cella con g1 e una con g3. I
 * due veri "estremi" della catena — le celle di g1 e g3 non toccate da g2
 * — devono essere uno acceso e l'altro spento; quindi ogni cella esterna
 * che vede entrambi non può ospitare V. Skyscraper, Two-String Kite e
 * Empty Rectangle sono le varianti classiche di Turbot Fish.
 */
@Component({
  selector: 'turbot-fish-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>L'idea — tre strong link concatenati</h3>
        <p>
          Fissiamo un valore <strong>V</strong>. In un gruppo (riga, colonna
          o quadrato) dove V può stare <em>esattamente in 2 celle</em>
          abbiamo uno <strong>strong link</strong>: V andrà in una delle due
          e non nell'altra. Turbot Fish cerca <strong>tre</strong> di questi
          strong link legati tra loro:
        </p>
        <ul>
          <li>
            un gruppo <strong>g1</strong> con V in due celle — la cella
            "estremo" e una cella "interna";
          </li>
          <li>
            un gruppo di raccordo <strong>g2</strong> con V in due celle,
            che condivide la cella interna di g1 e la cella interna di g3;
          </li>
          <li>
            un gruppo <strong>g3</strong> con V in due celle — l'altra
            cella interna più la seconda cella "estremo".
          </li>
        </ul>
        <p>
          I due veri estremi (la cella di g1 non toccata da g2 e la cella
          di g3 non toccata da g2) si comportano come un'alternativa
          esclusiva: <strong>uno dei due deve contenere V</strong>. Qualsiasi
          cella che "vede" (stesso gruppo) entrambi gli estremi non può
          contenere V: in ogni scenario uno dei due estremi prende V e la
          collide.
        </p>
      </div>

      <div>
        <h3>Varianti classiche</h3>
        <ul>
          <li>
            <strong>Skyscraper</strong>: g1 e g3 sono due colonne (o due
            righe) con V in due celle, g2 è una riga (o colonna) che
            congiunge le celle alte.
          </li>
          <li>
            <strong>Two-String Kite</strong>: g1 è una riga e g3 una
            colonna, collegate da un quadrato g2.
          </li>
          <li>
            <strong>Empty Rectangle</strong>: stessa logica, g2 è un
            quadrato in cui V è confinato a una riga + una colonna.
          </li>
        </ul>
        <p>
          La nostra implementazione li riconosce tutti indistintamente
          cercando qualunque combinazione di 3 gruppi collegati.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — Turbot Fish per il valore 1</h3>
        <p class="caption">
          Stato al passo in cui il solver applica Turbot Fish. Il valore
          <strong>1</strong> ha tre strong link concatenati:
        </p>
        <ul class="reasons">
          <li>
            <strong>riga A</strong> (g1): 1 solo in <strong>A1</strong> e
            <strong>A5</strong>;
          </li>
          <li>
            <strong>quadrato 2</strong> (g2, raccordo): 1 solo in
            <strong>A5</strong> e <strong>C6</strong>;
          </li>
          <li>
            <strong>colonna 6</strong> (g3): 1 solo in <strong>C6</strong>
            e <strong>E6</strong>.
          </li>
        </ul>
        <p class="caption">
          La catena è <strong>A1 — A5 — C6 — E6</strong>. I due estremi
          sono <strong>A1</strong> ed <strong>E6</strong>: in ogni caso
          uno dei due contiene l'1.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="420">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          La cella <strong>E1</strong> vede <strong>A1</strong> (stessa
          colonna) ed <strong>E6</strong> (stessa riga): qualunque dei due
          estremi prenda l'1, E1 non può averlo. Quindi il candidato 1 viene
          rimosso da E1 (candidati &#123;1, 2, 3, 9&#125; →
          &#123;2, 3, 9&#125;).
        </p>
      </div>

      <div>
        <h3>Come riconoscerlo velocemente</h3>
        <p>
          Scegli un valore V. Cerca tutti i gruppi (righe, colonne,
          quadrati) in cui V ha esattamente 2 posizioni e costruisci
          mentalmente un grafo di strong link. Per ogni terzetto g1–g2–g3
          in cui g2 aggancia g1 e g3 con due celle diverse, guarda gli
          estremi non comuni: se esiste una cella esterna che li vede
          entrambi, V si rimuove da lì.
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
export class TurbotFishInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale: schema proposto dall'utente (ammette più soluzioni, ma
    // uno dei rami del solver — via TryNumber — esibisce un Turbot Fish
    // pulito sul valore 1 prima di chiudersi).
    schema:
      '003008000000200100060040070040005080008000600050900010090020040007006000000100500',

    // Snapshot immediatamente prima dell'applicazione di Turbot Fish in quel
    // ramo: il valore 1 ha strong link in rigaA {A1,A5}, quadrato 2 {A5,C6}
    // e colonna 6 {C6,E6}. La catena collega A1 a E6 attraverso A5 e C6.
    values:
      '073508000080200100060340070040605080008700600050980010090023740007056000000100500',

    // Evidenziazioni didattiche (convenzione invertita rispetto al solver):
    // - cell  (primario)   = le 4 celle della catena di strong link:
    //                        A1, A5, C6, E6. A1 ed E6 sono gli estremi
    //                        "alternativi"; A5 e C6 sono le celle interne
    //                        condivise con il raccordo.
    // - cell2 (secondario) = la cella impattata da cui il valore 1 viene
    //                        rimosso: E1 (vede A1 in colonna ed E6 in riga).
    highlights: `cell A1, A5, C6, E6
cell2 E1`,
  };
}
