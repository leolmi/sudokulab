import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  getCoords,
  isEmptyCell,
  SudokuCell
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';
import { isEqual as _isEqual } from 'lodash';

export const UNIQUE_RECTANGLE_ALGORITHM = 'UniqueRectangle';

/**
 * ALGORITMO Unique Rectangle (tipo 1 + tipo 2)
 *
 * Sfrutta il vincolo di soluzione unica dello schema: se quattro celle
 * disposte ai vertici di un rettangolo su 2 righe, 2 colonne e solo 2 box
 * avessero tutte e quattro gli stessi 2 candidati {X,Y}, lo schema avrebbe
 * due soluzioni (deadly pattern). Quindi:
 *
 * - **Tipo 1**: 3 celle sono bi-valore [X,Y] e la quarta contiene X,Y più altri
 *   candidati → X e Y possono essere rimossi dalla quarta cella.
 * - **Tipo 2**: 2 celle sono bi-valore [X,Y] e le altre 2 (sulla stessa riga o
 *   colonna) contengono [X,Y,Z] → Z può essere rimosso da tutte le celle che
 *   vedono entrambe quelle terze celle.
 */
export class UniqueRectangleAlgorithm extends Algorithm {
  id = UNIQUE_RECTANGLE_ALGORITHM;
  priority = 12;
  factor = '+160+(NEP*40)';
  name = 'Unique Rectangle';
  icon = 'crop_square';
  type = AlgorithmType.support;
  title = 'Sfrutta l\'unicità della soluzione: un rettangolo di 4 celle con la stessa coppia di candidati porterebbe a soluzione doppia, e quindi consente di escludere valori che farebbero configurare il "deadly pattern"';
  description = 'Tecnica di uniqueness: applicabile solo quando lo schema è garantito a soluzione unica';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      // raccoglie celle bi-valore
      const biValue = cells.filter(c => isEmptyCell(c) && c.available.length === 2);
      // cerca due celle bi-valore sulla stessa riga con gli stessi candidati
      for (let i = 0; i < biValue.length; i++) {
        const a = biValue[i];
        for (let j = i + 1; j < biValue.length; j++) {
          const b = biValue[j];
          if (a.row !== b.row) continue;
          if (!_isEqual(a.available, b.available)) continue;
          const [x, y] = a.available;
          // cerca un'altra riga con le stesse colonne e appartenenza a 2 box
          for (let r = 0; r < 9; r++) {
            if (r === a.row) continue;
            const c = cells.find(cc => cc.row === r && cc.col === a.col);
            const d = cells.find(cc => cc.row === r && cc.col === b.col);
            if (!c || !d || !isEmptyCell(c) || !isEmptyCell(d)) continue;
            // le 4 celle devono stare in esattamente 2 box
            const boxes = new Set([a.sqr, b.sqr, c.sqr, d.sqr]);
            if (boxes.size !== 2) continue;
            const cHasXY = c.available.includes(x) && c.available.includes(y);
            const dHasXY = d.available.includes(x) && d.available.includes(y);
            if (!cHasXY || !dHasXY) continue;

            // Tipo 1: una delle due celle ha esattamente [x,y], l'altra ha più candidati
            if (_isEqual(c.available, [x, y]) && d.available.length > 2) {
              if (applyType1(this, res, [a.id, b.id, c.id], d, [x, y])) return;
            }
            if (_isEqual(d.available, [x, y]) && c.available.length > 2) {
              if (applyType1(this, res, [a.id, b.id, d.id], c, [x, y])) return;
            }

            // Tipo 2: sia c che d hanno esattamente [x,y,Z] (stessi 3 candidati)
            if (c.available.length === 3 && _isEqual(c.available, d.available)) {
              const z = c.available.find(v => v !== x && v !== y);
              if (z && applyType2(this, res, [a.id, b.id], [c, d], z, cells)) return;
            }
          }
        }
      }
    });
}

const applyType1 = (alg: Algorithm, res: AlgorithmResult, otherIds: string[], target: SudokuCell, toRemove: string[]): boolean => {
  onRemoved(target, (v) => toRemove.includes(v), (removed) => {
    res.applied = true;
    res.highlights = getHighlights(target, otherIds);
    res.descLines = getSingleResultLine(target,
      `Found ${alg.name} type 1 on cells ${getCoords(otherIds)}: on cell ${target.coord} the values [${removed.join(',')}] have been removed to avoid the deadly pattern`);
  });
  return res.applied;
}

const applyType2 = (alg: Algorithm, res: AlgorithmResult, pairIds: string[], roof: SudokuCell[], z: string, cells: SudokuCell[]): boolean => {
  // Z deve essere rimosso dalle celle che vedono sia roof[0] che roof[1]
  const [r1, r2] = roof;
  const targets = cells.filter(c =>
    isEmptyCell(c) &&
    c.id !== r1.id && c.id !== r2.id &&
    c.available.includes(z) &&
    canSeeBoth(c, r1, r2));
  for (const t of targets) {
    onRemoved(t, z, (removed) => {
      res.applied = true;
      res.highlights = getHighlights(t, [...pairIds, r1.id, r2.id]);
      res.descLines = getSingleResultLine(t,
        `Found ${alg.name} type 2 on cells ${getCoords(pairIds)},${r1.coord},${r2.coord}: on cell ${t.coord} the value [${removed.join(',')}] has been removed`);
    });
    if (res.applied) return true;
  }
  return false;
}

const canSeeBoth = (c: SudokuCell, a: SudokuCell, b: SudokuCell): boolean =>
  (c.row === a.row || c.col === a.col || c.sqr === a.sqr) &&
  (c.row === b.row || c.col === b.col || c.sqr === b.sqr);

// registra l'algoritmo
registerAlgorithm(new UniqueRectangleAlgorithm());
