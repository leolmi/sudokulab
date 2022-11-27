import {Algorithm} from '../Algorithm';
import {PlaySudoku} from '../PlaySudoku';
import {AlgorithmResult, AlgorithmResultLine} from '../AlgorithmResult';
import {Dictionary} from '@ngrx/entity';
import {extend as _extend, forEach as _forEach, includes as _includes, keys as _keys, reduce as _reduce, remove as _remove} from 'lodash';
import {checkAvailables, getGroupCouples, getGroupExplicitCouples} from '../logic';
import {getUserCoord, getGroups} from '../../sudoku.helper';
import {AlgorithmType} from '../enums';
import {debug, isValue} from '../../global.helper';
import {SDK_PREFIX_DEBUG} from "../consts";

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
  // il twins è più difficile da vedere e usare se sono molti i numeri mancanti
  factor = '+20+(NEP*10)';
  name = 'Twins in group';
  icon = 'bookmarks';
  type = AlgorithmType.support;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    let applied = false;
    const descLines: AlgorithmResultLine[] = [];

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

      // Ricerca le coppie di fatto: ossia quelle coppie già formate.
      // Dalla precedente ricerca non emergono quelle coppie che sono già
      // presenti per normale esclusione di valori dalle regole fondamentali
      // del sudoku.
      _extend(couples_map, getGroupExplicitCouples(sdk, g));
      // ricerca quindi le coppie di celle che possono contenere i due numeri
      const couple = _keys(couples_map).find(ids => (couples_map[ids] || []).length === 2);

      if (!!couple) {
        const ids = couple.split('|');
        const values = couples_map[couple];
        // toglie dai valori possibili delle celle gemelle gli altri valori
        ids.filter(id => !isValue(sdk.cells[id]?.value))
          .forEach(id => {
            const removed = _remove(sdk.cells[id]?.availables||[], v => !_includes(values, v));
            if (removed.length > 0) {
              applied = true;
              // console.log(`TWINS DATA couple:`, couple, '\n\tvalues:', values, '\n\tids:', ids, '\n\tcouples map:', couples_map);
              descLines.push(new AlgorithmResultLine({
                cell: id,
                others: ids,
                description: `Found twins ${ids.map(tid => getUserCoord(tid)).join(' ')} per i valori [${values||'?'}].
  On cell ${getUserCoord(id)} only available are [${sdk.cells[id]?.availables}], so [${removed.join(',')}] have been removed on twins`
              }));
            }
          });
        // elimina la coppia di valori dagli availables delle altre celle presenti
        // nei gruppi comuni alle celle della coppia
        getGroups(sdk, ids)
          .forEach(g => g.cells
            .filter(gcid => !isValue(sdk.cells[gcid]?.value))
            .forEach(gcid => {
              if (!_includes(ids, gcid)) {
                const removed = _remove(sdk.cells[gcid]?.availables||[], v => _includes(values, v));
                if (removed.length > 0) {
                  applied = true;
                  // gcid: id del gruppo da cui vengono tolti dei valori possibili
                  // removed: eleneco dei valori rimossi
                  // console.log(`TWINS DATA group:`, g, '\n\tvalues:', values, '\n\tids:', ids, '\n\tcouples map:', couples_map);
                  descLines.push(new AlgorithmResultLine({
                    cell: gcid,
                    others: ids,
                    description: `Found twins ${ids.map(tid => getUserCoord(tid)).join(' ')} per i valori [${values||'?'}].
  On cell ${getUserCoord(gcid)} only available are [${sdk.cells[gcid]?.availables}], so [${removed.join(',')}] have been removed by twins`
                  }));
                }
              }
            }));
      }
    });

    if (applied) checkAvailables(sdk);

    return new AlgorithmResult({
      algorithm: this.id,
      applied,
      descLines
    });
  }
}
