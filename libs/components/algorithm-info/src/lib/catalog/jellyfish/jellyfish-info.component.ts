import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Dictionary } from '@olmi/model';
import { JELLYFISH_ALGORITHM } from '@olmi/algorithms';

import { AlgorithmInfoPageComponent } from '../../markdown/algorithm-info-page.component';
import { SudokuBoardPreviewSample } from '../../sudoku-board-preview/sudoku-board-preview.component';

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
  imports: [AlgorithmInfoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<algorithm-info-page [key]="key" [samples]="samples"></algorithm-info-page>`,
})
export class JellyfishInfoComponent {
  readonly key = JELLYFISH_ALGORITHM;

  readonly samples: Dictionary<SudokuBoardPreviewSample> = {
    example_1: {
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
    },
  };
}
