import {
  forEach as _forEach,
  includes as _includes,
  intersection as _intersection,
  keys as _keys,
  reduce as _reduce,
  remove as _remove,
  uniq as _uniq
} from 'lodash';
import {Algorithm} from "../Algorithm";
import {AlgorithmType} from "../enums";
import {PlaySudoku} from "../PlaySudoku";
import {AlgorithmResult, AlgorithmResultLine} from "../AlgorithmResult";
import {Dictionary} from "@ngrx/entity";
import {getAllGroups, getByVisibles, getGroups, getUserCoord} from "../../sudoku.helper";
import {checkAvailable} from "../logic";

export const CHAINS_ALGORITHM = 'Chains';

/**
 * ALGORITMO
 *
 * rileva relazioni tra tre gruppi:
 * - due dove solo due celle possono ospitare un determinato valore
 * - un terzo (di raccordo) che ospita due delle celle dei primi 2 gruppi
 */
export class ChainsAlgorithm extends Algorithm {
  id = CHAINS_ALGORITHM;
  factor = '+170';
  name = 'Chains over groups';
  icon = 'share';
  type = AlgorithmType.support;
  title = 'quando coppie di stessi valori coinvivono all\'interno di tre gruppi diversi legati per le celle che ospitano tali valori, questi fanno si che sia possibile escludere il valore da celle eserne ai gruppi considerati';
  description = 'Discretamente complesso da capire ed applicare, anch\'esso non risolve un valore di una cella ma contribuisce con i precedenti';
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    let applied = false;
    const descLines: AlgorithmResultLine[] = [];
    const cells: Dictionary<boolean> = {};

    _forEach(sdk.groups, (g1) => {
      // ricerca i valori presenti solo in 2 celle del gruppo
      _forEach(g1?.availableOnCells || {}, (cls, v) => {
        // gks1 = chiavi delle 2 celle che contengono il valore "v"
        const gks1 = _keys(cls);
        // se il valore "v" è contenuto solo in due celle attiva la verifica
        if (gks1.length === 2) {
          // considera tutti i gruppi diversi dal corrente che hanno
          // lo stesso valore possibile più volte
          // questo è il gruppo di raccordo, quindi non necessariamente deve
          // contenere il valore 2 volte, ma il valore deve essere in due celle diverse uno per gruppo 1 e 3.
          getAllGroups(sdk, gks1).forEach(g2 => {
            // gks2 = chiavi delle 2 celle di raccordo
            const gks2 = _keys(g2.availableOnCells[v] || {});
            // il secondo gruppo compatibile ha anch'esso almeno 2 celle per ospitare il valore "v"
            if (gks2.length > 1 && g2.id !== g1?.id) {
              // ricerca adesso il terzo gruppo con le stessa caratteristiche del primo
              // ossia dove il valore è inseribile in solo 2 celle
              getAllGroups(sdk, gks2).forEach(g3 => {
                // gks3 = chiavi delle altre 2 celle che contengono il valore "v"
                const gks3 = _keys(g3.availableOnCells[v] || {});
                if (gks3.length === 2 && g3.id !== g2.id && g3.id !== g1?.id && _intersection(gks3, gks1).length === 0) {
                  // trovati i 3 gruppi legati tra loro, si ricavano ora le celle esterne
                  // cioè non facenti parte del secondo gruppo
                  const externals = gks1.concat(gks3);
                  // all = tutte le celle trovate origine di copiie di valori intersecati
                  const all = _uniq(externals.concat(gks2));
                  const all_map: any = _reduce(all, (x, id) => ({...x, [id]: true}), {});
                  gks2.forEach(k2 => _remove(externals, k12 => k12 === k2));
                  // se queste celle NON appartengono ad un o stesso gruppo possono portare
                  // all'esclusione di valori nelle intersezioni
                  const groups3 = getGroups(sdk, externals);
                  if (groups3.length < 1) {
                    // determinazione delle celle interessate, ossia quelle che "vedono" contemporaneamente
                    // entrambe le celle e che contengono come valore possibile "v" (e non fanno parte delle externals_all)
                    const vcells = getByVisibles(sdk, externals).filter(c => !all_map[c.id] && _includes(c.availables, v));
                    // if (vcells.length>0) {
                    //   console.log('APPLICABILITA\' DELL\'ALGORITMO Chains', this.id,
                    //     '\n\tvalore', v,
                    //     '\n\texternal cells', externals,
                    //     '\n\tall externals', externals_all,
                    //     '\n\tvcells', vcells,
                    //     `\n\tG1: ${g1?.id}`, gks1,
                    //     `\n\tG2: ${g2?.id}`, gks2,
                    //     `\n\tG3: ${g3?.id}`, gks3,
                    //     '\n\tvalues', getValues(sdk),
                    //     '\n\ton cells', cells);
                    // }
                    let applied_now = false;
                    vcells.forEach(c => {
                      const removed = _remove(sdk.cells[c.id]?.availables || [], av => av === v);
                      if (removed.length > 0) {
                        applied = true;
                        descLines.push(new AlgorithmResultLine({
                          cell: c.id,
                          others: all,
                          description: `On cell ${getUserCoord(c.id)} the possible values [${removed.join(',')}] have been removed`
                        }));
                        applied_now = true;
                      }
                    });
                    // vanno aggiornate le collezioni altrimenti non è corretta l'esecuzione successiva
                    if (applied_now) checkAvailable(sdk);
                  }
                }
              });
            }
          })
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
