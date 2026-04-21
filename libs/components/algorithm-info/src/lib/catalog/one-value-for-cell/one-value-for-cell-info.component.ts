import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SudokuBoardPreviewComponent,
  SudokuBoardPreviewSample,
} from '../../sudoku-board-preview/sudoku-board-preview.component';

/**
 * Pagina di descrizione dell'algoritmo One Value For Cell.
 *
 * Una cella ha un solo candidato possibile: tutti gli altri otto valori sono
 * già presenti nella sua riga, nella sua colonna o nel suo quadrato. In quella
 * cella si può piazzare direttamente l'unico valore rimasto.
 */
@Component({
  selector: 'one-value-for-cell-info',
  standalone: true,
  imports: [CommonModule, FlexLayoutModule, SudokuBoardPreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="alg-page" fxLayout="column" fxLayoutGap="24px">
      <div>
        <h3>Quando si applica</h3>
        <p>
          Si sceglie una cella vuota e si guardano i tre gruppi a cui
          appartiene (riga, colonna, quadrato). Se tra i valori <strong>1–9
          </strong>ne rimane <strong>uno soltanto</strong> non ancora presente
          in nessuno dei tre gruppi, quella cella <strong>deve</strong>
          contenere quel valore.
        </p>
        <p>
          A differenza di <em>One Cell For Value</em>, che parte da un valore
          e cerca la cella che può ospitarlo in un gruppo, qui si parte dalla
          cella e si elimina candidato per candidato finché ne resta uno
          solo. È meno immediato a occhio nudo: occorre tenere traccia dei
          candidati (la tabella dei "pencil marks"), motivo per cui in
          SudokuLab ha un peso di difficoltà leggermente più alto.
        </p>
      </div>

      <div class="example" fxLayout="column" fxLayoutGap="12px">
        <h3>Esempio — cella A5</h3>
        <p class="caption">
          La cella <strong>A5</strong> è evidenziata in primario. I suoi tre
          gruppi — riga <strong>A</strong>, colonna <strong>5</strong>,
          quadrato in alto al centro — sono colorati di sfondo: contengono
          già otto valori distinti (1, 2, 3, 4, 5, 6, 8, 9). L'unico valore
          ancora ammissibile è il <strong>7</strong>, quindi A5 = 7.
        </p>
        <div fxLayout="row" fxLayoutAlign="center center">
          <sudoku-board-preview [sample]="example_1" [size]="400">
          </sudoku-board-preview>
        </div>
        <p class="caption">
          Controllo rapido: riga A contiene già 3, 4, 6, 2, 1, 9; colonna 5
          contiene 5, 8, 6, 4; il quadrato in alto al centro contiene 6, 2,
          5, 4. L'unione di questi valori è &#123; 1, 2, 3, 4, 5, 6, 8, 9 &#125;: manca
          solo il 7.
        </p>
      </div>

      <div>
        <h3>Perché funziona</h3>
        <p>
          Una cella deve assumere uno dei nove valori 1–9. Se otto di questi
          sono vietati dai tre gruppi di appartenenza, l'unico ammissibile è
          obbligato: non esiste un'altra soluzione possibile per quella cella.
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
export class OneValueForCellInfoComponent {
  readonly example_1: SudokuBoardPreviewSample = {
    // Clue iniziale del puzzle (schema HARD preso da documents/catalog.json):
    // risolvendolo il solver applica OneValueForCell la prima volta al passo 2
    // sulla cella A5 (valore 7).
    schema:
      '034002109070004000000050060060003201050080003003000000000060000695700000017040000',

    // Snapshot immediatamente prima del passo OneValueForCell: include i due
    // valori dinamici piazzati ai passi 0-1 dall'algoritmo precedente
    // (OneCellForValue). Con questi valori A5 resta con un solo candidato: 7.
    values:
      '034602109076004000000050060060003201050080003003000000000060000695700000017040000',

    // Evidenziazioni didattiche:
    // - cell  (primario)   = la cella vincolata al valore unico (A5).
    // - row/col/sqr        = i tre gruppi che, insieme, eliminano gli altri
    //                        otto candidati dalla cella.
    highlights: `cell A5
row A
col 5
sqr 2`,
  };
}
