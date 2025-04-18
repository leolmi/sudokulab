import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  Couple,
  findCouples,
  findGroup,
  getCommonGroups,
  getGroupCells, groupCoord,
  SudokuCell, SudokuGroup
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';

export const TWINS_ALGORITHM = 'Twins';

/**
 * ALGORITMO
 * Gemelli
 *
 * se all'interno di un gruppo due celle possono contenere la stessa coppia di valori
 * allora posso escludere questi valori da tutte le altre celle
 *
 * fattore: +20
 */
export class TwinsAlgorithm extends Algorithm {
  id = TWINS_ALGORITHM;
  priority = 2;
  // il twins è più difficile da vedere e usare se sono molti i numeri mancanti
  factor = '+20+(NEP*10)';
  name = 'Twins in group';
  icon = 'bookmarks';
  type = AlgorithmType.support;
  title = 'quando una coppia di celle all\'interno di un gruppo può contenere la stessa coppia di valori questi possono essere esclusi da tutte le altre celle del gruppo e dagli altri gruppi che le contengono';
  description = 'Complesso poco più del precedente non risolve un valore di una cella ma contribuisce con i precedenti. Per questo ha un punteggio leggermente più alto del precedente';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      findGroup(cells, (gcells, g) => {
        // if (g.type === GroupType.row && g.pos === 3) {
        //   const vm = getCellsAvailableMap(gcells);
        //   console.log(`GROUP ${g.id}`, gcells, '\n\tVMAP', vm);
        // }
        return findCouples(gcells, g, (cpls) => {
          // if (cpls.length > 0) {
          //   console.log(`found ${cpls.length} couples in group "${g.id}"`, cpls);
          // } else {
          //   console.log(`found no couples in group "${g.id}"`);
          // }
          return !!cpls.find((cpl: Couple) => {
            // prima di tutto elimina gli altri valori possibili nelle celle gemelle se presenti
            if (checkAvailable(res, cpl, cpl.cell1, true)) return true;
            if (checkAvailable(res, cpl, cpl.cell2, true)) return true;

            // ricerca il primo gruppo comune alle celle in cui riesce a ridurre i valori possibili
            return getCommonGroups(cells, [cpl.cell1, cpl.cell2]).find(g => {
              const gcells = getGroupCells(cells, g);
              return !!gcells.find(gc => {
                if (!gc.isFixed &&
                  !gc.text &&
                  gc.id !== cpl.cell1.id &&
                  gc.id !== cpl.cell2.id) {
                  // se nelle celle diverse dai gemelli ma appartenenti al gruppo
                  // trova, tra i possibili uno dei valori dei gemelli, lo rimuove
                  checkAvailable(res, cpl, gc, false, [g]);
                }
                return res.applied;
              });
            });
          });
        })
      })
    });
}

const checkAvailable = (res: AlgorithmResult, cpl: Couple, cell: SudokuCell, inside: boolean, gs: SudokuGroup[] = []): boolean => {
  onRemoved(cell, (v) => inside ? !cpl.values.includes(v) : cpl.values.includes(v), (removed) => {
    res.applied = true;
    const group = gs.length ? gs[0] : cpl.group;
    res.highlights = getHighlights(cell, [cpl.cell1.id, cpl.cell2.id], [group]);
    res.descLines = getSingleResultLine(cell,
      `Found twins (${cpl.cell1.coord},${cpl.cell2.coord}) in group ${groupCoord(group)} with values [${cpl.values||'?'}].
      So on cell ${cell.coord} the values [${removed.join(',')}] have been removed`);
  });
  return res.applied;
}


// registra l'algoritmo
registerAlgorithm(new TwinsAlgorithm());
