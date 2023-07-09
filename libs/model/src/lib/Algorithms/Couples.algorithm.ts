import {difference as _difference, forEach as _forEach, intersection as _intersection, keys as _keys, remove as _remove} from 'lodash';
import {Algorithm} from "../Algorithm";
import {AlgorithmType} from "../enums";
import {PlaySudoku} from "../PlaySudoku";
import {AlgorithmResult, AlgorithmResultLine} from "../AlgorithmResult";
import {Dictionary} from "@ngrx/entity";
import {getAllGroups, getByVisibles, getUserCoord} from "../../sudoku.helper";
import {checkAvailables} from "../logic";

export const COUPLES_ALGORITHM = 'Couples';

/**
 * ALGORITMO DELLE COPPIE
 *
 * esclude valori in celle risultanti dall'incrocio di coppie presenti in altri gruppi.
 *
 *      XY ---- YZ             XY ---- YZ
 *      |            oppure            |
 *      |                              |
 *      XZ      -Z            -X       ZX
 */
export class CouplesAlgorithm extends Algorithm {
  id = COUPLES_ALGORITHM;
  factor = '+150';
  name = 'Couples over groups';
  icon = 'move_down';
  type = AlgorithmType.support;
  title = 'quando coppie di valori producono allineamenti su uno dei valori possono far si che sia possibile escludere un valore da celle eserne ai gruppi considerati';
  description = 'Abbastanza complesso non risolve un valore di una cella ma contribuisce con i precedenti';
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    let applied = false;
    const descLines: AlgorithmResultLine[] = [];
    const cells: Dictionary<boolean> = {};

    const done: Dictionary<boolean> = {};

    _forEach(sdk.groups, (g_XYZ) => {
      // ricerca le coppie di valori nel gruppo
      g_XYZ?.cells.forEach((cid_XY) => {
        if (!done[cid_XY]) {
          // cella 1 (SINISTRA)
          const cell_XY = sdk.cells[cid_XY];
          const XY = cell_XY?.availables || [];
          if (XY.length === 2) {
            // ricerca una seconda cella con una coppia che contenga uno dei due valori (non entrambi)
            // data la coppia XY, trovati i complementari YZ, per ognuno ricerca il
            // complementare (ZX) destro o sinitro cioè
            // - su un gruppo che "vede" solo XY (sinistro) o
            // - su uno che "vede" solo YZ (destro)
            g_XYZ?.cells.forEach((cid_YZ) => {
              const cell_YZ = sdk.cells[cid_YZ];
              const YZ = cell_YZ?.availables || [];
              const Y = _intersection(XY, YZ);
              if (!done[cid_YZ] && cid_YZ !== cid_XY && YZ.length === 2 && Y.length === 1) {
                const X = _difference(XY, YZ);
                // ricerca del complementare destro (su ZX):
                getAllGroups(sdk, [cid_YZ]).find(g_YZX => {
                  if (g_YZX.id !== g_XYZ.id) {
                    // elenco delle celle che rispondono ai requisiti:
                    // tutte quelle che generano una tripletta XY - YZ - ZH
                    g_YZX.cells.forEach(cid_ZX => {
                      const cell_ZX = sdk.cells[cid_ZX];
                      const ZX = cell_ZX?.availables || [];
                      const Z = _intersection(YZ, ZX);
                      if (!done[cid_ZX] && cid_ZX !== cid_YZ && YZ.length === 2 && Z.length === 1) {
                        const X2 = _difference(ZX, YZ);
                        if (X2.length === 1 && X2[0] === X[0] && Y[0] !== Z[0] && X[0] !== Z[0]) {

                          console.log(`APPLICABILITA' DELL'ALGORITMO COUPLES:\n\tcell XY`, cell_XY,
                            '\n\tcell YZ', cell_YZ, '\n\tcell ZX', cell_ZX);

                          // trovato la tripletta corretta...
                          // può eliminare X dalle celle che vedono contemporaneamente cell_XY & cell_ZX
                          let applied_now = false;
                          getByVisibles(sdk, [cid_XY, cid_ZX])
                            .forEach(c => {
                              const removed = _remove(sdk.cells[c.id]?.availables || [], av => av === X[0]);
                              if (removed.length > 0) {
                                applied = true;
                                descLines.push(new AlgorithmResultLine({
                                  cell: c.id,
                                  others: [cid_XY, cid_YZ, cid_ZX],
                                  description: `On cell ${getUserCoord(c.id)} the possible values [${removed.join(',')}] have been removed`
                                }));
                                applied_now = true;
                              }
                            });
                          // vanno aggiornate le collezioni altrimenti non è corretta l'esecuzione successiva
                          if (applied_now) checkAvailables(sdk);
                        }
                      }
                    });
                  }
                });

                // ricerca del complementare sinistro:
                // TODO ...
              }
            });
          }
        }
      });
    });

    return new AlgorithmResult({
      algorithm: this.id,
      applied,
      descLines,
      cells: _keys(cells)
    }, sdk);
  }
}
