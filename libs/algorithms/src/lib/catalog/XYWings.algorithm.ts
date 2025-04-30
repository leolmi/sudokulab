import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType, canSee,
  getByVisibles,
  getCoord,
  SudokuCell
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';
import { intersection as _intersection } from 'lodash';

export const XYWINGS_ALGORITHM = 'XYWings';

/**
 * ALGORITMO XY-Wings
 *
 * Quando due celle dette ali entrambe con due valori possibili condividono tali valori alternativamente
 * con la terza cella detta pivot, il terzo valore condiviso solo dalle ali può essere escluso dalle celle
 * vuote che "vedono le ali
 *
 * fattore: +190
 */
export class XYWingsAlgorithm extends Algorithm {
  id = XYWINGS_ALGORITHM;
  priority = 8;
  factor = '+190';
  name = 'XY-Wings';
  icon = 'widgets';
  type = AlgorithmType.support;
  title = `Quando due celle dette ali entrambe con due valori possibili condividono tali valori alternativamente
  con la terza cella detta pivot, il terzo valore condiviso solo dalle ali può essere escluso dalle celle
  vuote che "vedono le ali"`;
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      return !!cells.find(pivot => {
        if (pivot.available.length === 2) {
          return !!cells.find(cw1 => {
            const w1v = _intersection(cw1.available, pivot.available);
            // la prima cella wing deve avere uno dei suoi valori possibili
            // in comune con uno del pivot e "vederlo"
            if (cw1.id !== pivot.id && canSee(pivot, cw1) && cw1.available.length===2 && w1v.length === 1) {
              // pivot + cw1
              return !!cells.find(cw2 => {
                const w2v = _intersection(cw2.available, pivot.available);
                const w12v = _intersection(cw1.available, cw2.available);
                // la seconda cella wing deve "vedere" il pivot, avere anch'essa 2 soli valori possibili,
                // uno in comune col pivot e l'altro in comune con la prima cella wing
                if (cw2.id !== pivot.id && cw2.id !== cw1.id &&
                  canSee(pivot, cw2) &&
                  cw2.available.length === 2 &&
                  w2v.length === 1 && w1v[0] !== w2v[0] &&
                  w12v.length === 1) {
                  // pivot [A,B] + cw1 [A,X] + cw2 [B,X]
                  // adesso nelle celle che "vedono cw1 e cw2" diverse dal pivot è possibile escludere
                  // il valore X comune alle wing ma non presente nel pivot
                  const v = w12v[0];
                  const cids = [pivot.id, cw1.id, cw2.id];
                  return !!getByVisibles(cells, [cw1.id, cw2.id]).find(tc => {
                    // la cella trovata deve essere diversa dal pivot e dalle ali
                    if (!cids.includes(tc.id)) {
                      onRemoved(tc, v, (removed) => {
                        res.applied = true;
                        res.highlights = getHighlights(tc, cids);
                        res.descLines = getSingleResultLine(tc,
                          `Found ${this.name} on cells ${cids.map(cid => getCoord(cid)).join(',')}, so on cell ${tc.coord} the possible values [${removed.join(',')}] have been removed`);
                      });
                    }
                    return res.applied;
                  });
                }
                return res.applied;
              });
            }
            return res.applied;
          });
        }
        return res.applied;
      })
    })
}


// registra l'algoritmo
registerAlgorithm(new XYWingsAlgorithm());
