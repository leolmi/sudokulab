import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  canSee,
  getByVisibles,
  getCell,
  getCoord,
  isEmptyCell,
  SudokuCell
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onCouples, onRemoved, registerAlgorithm } from '../algorithms.common';

export const WWINGS_ALGORITHM = 'WWings';

/**
 * ALGORITMO W-Wing
 *
 * Due celle "ali" bivalore con la STESSA coppia di valori {A,B}, collegate da un
 * legame forte (conjugate pair) su uno dei due valori:
 *
 *      A=[XY] ───vede─── P[X] ══(legame forte su X)══ Q[X] ───vede─── B=[XY]
 *
 * poiché nel gruppo del legame forte la X sta o in P o in Q, almeno una tra le
 * due ali varrà per forza Y: la Y è quindi escludibile da tutte le celle vuote
 * che "vedono" entrambe le ali.
 *
 * NB: è una tecnica distinta dall'XY-Wing (`XYWings`, 3 celle con pivot): qui le
 * due ali condividono l'intera coppia e il raccordo è un legame forte, non un pivot.
 *
 * fattore: +200+(NEP*70)
 */
export class WWingsAlgorithm extends Algorithm {
  id = WWINGS_ALGORITHM;
  priority = 11;
  factor = '+200+(NEP*70)';
  name = 'W-Wing';
  icon = 'sync_alt';
  type = AlgorithmType.support;
  title = 'alg.WWings.title';
  description = 'alg.WWings.description';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      // P,Q = le UNICHE due celle di un gruppo a poter contenere `link` (legame forte)
      onCouples(res, cells, (info) => {
        const link = info.value;
        const [id1, id2] = info.ids;
        // entrambe le associazioni ala↔estremo del legame forte
        return this.tryPair(cells, res, link, id1, id2) || this.tryPair(cells, res, link, id2, id1);
      });
    })

  /**
   * cerca due ali bivalore con la stessa coppia {link, elim}:
   * - A "vede" l'estremo `pid` del legame forte su `link`
   * - B "vede" l'estremo `qid`
   * essendo `link` confinato in pid/qid, almeno una tra A/B vale `elim`, quindi
   * `elim` è escludibile dalle celle che vedono sia A che B.
   */
  private tryPair(cells: SudokuCell[], res: AlgorithmResult, link: string, pid: string, qid: string): boolean {
    const P = getCell(cells, pid);
    const Q = getCell(cells, qid);
    if (!P || !Q) return res.applied;
    return !!cells.find(cwa => {
      // prima ala: bivalore [link, elim], diversa dagli estremi, che "vede" pid
      if (cwa.id === pid || cwa.id === qid || !isEmptyCell(cwa) ||
        cwa.available.length !== 2 || !cwa.available.includes(link) || !canSee(cwa, P)) return res.applied;
      const elim = <string>cwa.available.find(v => v !== link);
      return !!cells.find(cwb => {
        // seconda ala: stessa coppia, diversa dagli estremi e dalla prima ala, che "vede" qid
        if (cwb.id === cwa.id || cwb.id === pid || cwb.id === qid || !isEmptyCell(cwb) ||
          cwb.available.length !== 2 || !cwa.available.every(v => cwb.available.includes(v)) || !canSee(cwb, Q)) return res.applied;
        const cids = [cwa.id, cwb.id];
        return !!getByVisibles(cells, cids).find(tc => {
          if (!cids.includes(tc.id)) {
            onRemoved(tc, elim, (removed) => {
              res.applied = true;
              res.highlights = getHighlights(tc, [cwa.id, cwb.id, pid, qid]);
              res.descLines = getSingleResultLine(tc,
                `Found ${this.name} on cells ${getCoord(cwa.id)},${getCoord(cwb.id)} (pair [${cwa.available.join('')}], strong link on ${link} between ${getCoord(pid)} and ${getCoord(qid)}), so on cell ${tc.coord} the possible values [${removed.join(',')}] have been removed`);
            });
          }
          return res.applied;
        });
      });
    });
  }
}


// registra l'algoritmo
registerAlgorithm(new WWingsAlgorithm());
