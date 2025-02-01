import {Algorithm} from "../Algorithm";
import {AlgorithmType} from "../enums";
import {PlaySudoku} from "../PlaySudoku";
import {AlgorithmResult, AlgorithmResultLine} from "../AlgorithmResult";
import {
  applyAlgorithm,
  findCommonAffectedCells,
  hasNAvailable,
  notifyApplied,
  NotifyAppliedArgs,
  onCells
} from "./algorithms.common";
import {PlaySudokuCell} from "../PlaySudokuCell";
import {getUserCoord} from "../../sudoku.helper";
import {remove as _remove} from 'lodash';

export const YWINGS_ALGORITHM = 'YWings';

/**
 * ALGORITMO
 * Y-Wings
 *
 *
 *
 * fattore: +190
 */
export class YWingsAlgorithm extends Algorithm {
  id = YWINGS_ALGORITHM;
  // y-wings è più difficile da vedere e usare se sono molti i numeri mancanti
  factor = '+190';
  name = 'Y-Wings';
  icon = 'widgets';
  type = AlgorithmType.support;
  title = '...';
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    return applyAlgorithm(this, sdk, (o) => {
      onCells(sdk, (c1) => {
        if (c1 && hasNAvailable(c1)) {
          const links = findLinkedCellsWithTwoCandidates(sdk, c1);
          if (links.length >= 2) {
            for (let i = 0; i < links.length - 1; i++) {
              for (let j = i + 1; j < links.length; j++) {
                const c2 = links[i];
                const c3 = links[j];
                const shared = c2.availables.filter(x => c3.availables.includes(x));
                if (shared.length === 1) {
                  const wing1 = c2.availables.filter(x => x !== shared[0]);
                  const wing2 = c3.availables.filter(x => x !== shared[0]);

                  if (wing1.length === 1 && wing2.length === 1 && wing1[0] === wing2[0]) {
                    // Eliminazione: escludiamo il candidato condiviso da altre celle comuni
                    const afected = findCommonAffectedCells(sdk, c2, c3);
                    afected.forEach(ac => {
                      const removed = _remove(ac.availables || [], v => v === shared[0]);
                      const args = <NotifyAppliedArgs>{
                        cid: ac.id,
                        cids: [c1.id, c2.id, c3.id],
                        removed
                      };
                      notifyApplied(this, o, args);
                    });
                  }
                }
              }
            }
          }
        }
      });
    });
  }
}

/**
 * restituisce tutte le celle diverse da c che hanno 2 volori possibili di cui almeno uno uguale ad uno di c
 * @param sdk
 * @param c
 */
const findLinkedCellsWithTwoCandidates = (sdk: PlaySudoku, c: PlaySudokuCell): PlaySudokuCell[] => {
  const links: PlaySudokuCell[] = [];
  onCells(sdk, (c2) => {
    if (c2 && hasNAvailable(c2) && c.availables.some(v => c2.availables.includes(v))) {
      links.push(c2)
    }
  }, [c]);
  return links;
}
