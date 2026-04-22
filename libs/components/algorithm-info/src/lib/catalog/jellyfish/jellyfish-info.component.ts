import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo Jellyfish.
 *
 * Estensione di X-Wings (N=2) e Swordfish (N=3) al caso N=4: un valore V
 * compare come candidato in 2-4 celle per ciascuna di 4 righe, e queste celle
 * sono confinate nelle stesse 4 colonne (o viceversa). Nelle altre celle di
 * quelle 4 colonne (o righe) V può essere rimosso.
 */
@Component({
  selector: 'jellyfish-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Fissiamo un valore <strong>V</strong>. Jellyfish vede il pattern
          quando:
        </p>
        <ul>
          <li>
            in <strong>quattro righe</strong> distinte V può stare solo in
            2-4 celle ciascuna;
          </li>
          <li>
            l'unione di tutte queste posizioni cade <em>esattamente</em>
            nelle stesse <strong>quattro colonne</strong>.
          </li>
        </ul>
        <p>
          (Vale il simmetrico scambiando righe con colonne.) Le quattro righe
          "catturano" tutti i posti liberi per V nelle quattro colonne.
          Quindi in quelle quattro righe V deve necessariamente stare dentro
          le quattro colonne del fish: può essere rimosso da tutte le altre
          celle di quelle quattro colonne.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Ciascuna delle quattro colonne deve contenere V (è una cifra del
          sudoku). Poiché in ciascuna colonna V può stare solo in una delle
          quattro righe scelte, complessivamente V occupa esattamente quattro
          celle all'intersezione colonne × righe del fish (una per colonna,
          una per riga — corrispondenza biunivoca). Di conseguenza ciascuna
          riga ha già "il suo" V localizzato in quelle colonne: nelle altre
          celle della stessa riga V non può più comparire.
        </p>
        <p>
          X-Wings è il caso N = 2 di questa stessa logica; Swordfish è
          N = 3; Jellyfish è N = 4. Oltre N = 4 la tecnica diventa ridondante
          (un fish di taglia 5 su 9 righe equivale a un fish di taglia 4 sulle
          altre 4 — è il principio noto come <em>finned complement</em>).
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — Jellyfish per il valore 8</h3>
        <p class="caption">
          Stato al passo in cui il solver applica Jellyfish. Il candidato
          <strong>8</strong> è confinato a 2-4 celle in ciascuna di quattro
          righe:
        </p>
        <ul class="reasons">
          <li>riga B: <strong>B1</strong>, <strong>B9</strong>;</li>
          <li>
            riga C: <strong>C1</strong>, <strong>C7</strong>,
            <strong>C9</strong>;
          </li>
          <li>
            riga H: <strong>H1</strong>, <strong>H2</strong>,
            <strong>H7</strong>, <strong>H9</strong>;
          </li>
          <li>
            riga I: <strong>I1</strong>, <strong>I2</strong>,
            <strong>I9</strong>.
          </li>
        </ul>
        <p class="caption">
          L'unione di queste dodici posizioni tocca <em>solo</em> le colonne
          <strong>1</strong>, <strong>2</strong>, <strong>7</strong> e
          <strong>9</strong>: il pattern è completo.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="440">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Effetto: nelle quattro colonne del fish, le celle fuori dalle
          quattro righe perdono il candidato 8. In questo schema ciò colpisce
          la sola riga G — <strong>G1</strong>, <strong>G7</strong> e
          <strong>G9</strong> (tutte evidenziate in secondario).
        </p>
      </div>

      <div>
        <h3>Come riconoscerlo velocemente</h3>
        <p>
          Scegli un valore V e, per ogni riga, conta in quante colonne V può
          ancora stare (ignora le righe con una sola posizione: quelle sono
          naked singles). Cerca quattro righe con 2-4 posizioni ciascuna, poi
          guarda l'unione delle colonne coinvolte: se è esattamente 4 hai un
          Jellyfish. Ripeti scambiando righe e colonne.
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
        max-width: min(440px, 92vw);
        width: 100%;
      }
    `,
  ],
})
export class JellyfishInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale: schema proposto dall'utente (ammette più soluzioni, ma
    // uno dei rami del solver — via TryNumber — esibisce un Jellyfish pulito
    // sul valore 8 prima di chiudersi).
    schema:
      '003008000000200100060040070040005080008000600050900010090020040007006000000100500',

    // Snapshot immediatamente prima dell'applicazione di Jellyfish in quel
    // ramo: il valore 8 è confinato a {1,2,7,9} colonne nelle righe
    // {B, C, H, I}, che formano il fish di taglia 4.
    values:
      '013008000070203100060041070040005080008000600050980010090020040007406000000109500',

    // Evidenziazioni didattiche (convenzione invertita rispetto al solver):
    // - cell  (primario)   = le 12 celle del pattern (2-4 per ciascuna delle
    //                        quattro righe del fish): B1/B9, C1/C7/C9,
    //                        H1/H2/H7/H9, I1/I2/I9.
    // - cell2 (secondario) = tutte le celle impattate, cioè quelle in cui il
    //                        candidato 8 viene rimosso: G1, G7, G9. Il
    //                        solver in descLines cita solo la prima (G1).
    highlights: `cell B1, B9, C1, C7, C9, H1, H2, H7, H9, I1, I2, I9
cell2 G1, G7, G9`,
  };
}
