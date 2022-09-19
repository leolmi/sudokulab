import { Algorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { Dictionary } from '@ngrx/entity';
import {
  forEach as _forEach,
  includes as _includes,
  keys as _keys,
  reduce as _reduce,
  remove as _remove
} from 'lodash';
import { checkAvailables, getGroupCouples } from '../logic';
import {getCellUserCoord, getGroups} from '../../sudoku.helper';
import { addLine } from '../../global.helper';
import { AlgorithmType } from '../enums';

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
  factor = '+20';
  name = 'Twins in group';
  icon = 'bookmarks';
  type = AlgorithmType.support;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    let applied = false;
    let description = '';

    _forEach(sdk.groups, (g) => {
      // ricerca i valori che sono presenti solo in due celle
      //  availableOnCells:  { '2': { '0.1': true, '0.5': true }  }
      //  couples: { '2': ['0.1', '0.5'] }
      const couples = getGroupCouples(g);
      // trasforma le coppie in una mappa
      // couples_map: { '0.1|0.2': ['2'] }
      // in tal modo si evidenziano le coppie che hanno due valori
      const couples_map = _reduce(couples, (inv, ids, av) => {
        const id = (ids || []).join('|');
        inv[id] = inv[id] || [];
        (inv[id] || []).push(av);
        return inv;
      }, <Dictionary<string[]>>{});

      // ricerca quindi le coppie di celle che possono contenere i due numeri
      const couple = _keys(couples_map).find(ids => (couples_map[ids] || []).length === 2);
      if (!!couple) {
        const ids = couple.split('|');
        const values = couples_map[couple];
        // toglie dai valori possibili delle celle gemelle gli altri valori
        ids.forEach(id => {
          const removed = _remove(sdk.cells[id]?.availables||[], v => !_includes(values, v));
          if (removed.length > 0) {
            description = addLine(description, `On cell "${getCellUserCoord(id)}" the possible values [${removed.join(',')}] have been removed`);
            applied = true;
          }
        });
        // elimina la coppia di valori dagli availables delle altre celle presenti
        // nei gruppi comuni alle celle della coppia
        getGroups(sdk, ids).forEach(g =>
          g.cells.forEach(gcid => {
            if (!_includes(ids, gcid)) {
              const removed = _remove(sdk.cells[gcid]?.availables||[], v => _includes(values, v));
              if (removed.length > 0) {
                description = addLine(description, `On cell "${getCellUserCoord(gcid)}" the possible values [${removed.join(',')}] have been removed`);
                applied = true;
              }
            }
          }));
      }
    });

    if (applied) checkAvailables(sdk);

    return new AlgorithmResult({
      algorithm: this.id,
      applied,
      description
    });
  }
}
