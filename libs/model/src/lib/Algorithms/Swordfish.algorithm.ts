import {Algorithm} from "../Algorithm";
import {AlgorithmType, SudokuGroupType} from "../enums";
import {PlaySudoku} from "../PlaySudoku";
import {AlgorithmResult} from "../AlgorithmResult";
import {applyAlgorithm, getNValuesGroups, notifyApplied, NotifyAppliedArgs, ValuePositions} from "./algorithms.common";
import {decodeCellId, decodeGroupId, groupId, isEmptyCell} from "../../sudoku.helper";
import {SUDOKU_DEFAULT_RANK} from "../consts";
import {keys as _keys, reduce as _reduce, remove as _remove, values as _values} from 'lodash';
import {Dictionary} from "@ngrx/entity";

export const SWORDFISH_ALGORITHM = 'Swordfish';

interface Intersection {
  // tipo intersezione
  type: SudokuGroupType;
  // posizione (0-index)
  pos: number;
  // group identity
  gid: string;
  // dizionario delle celle bloccate (fanno parte dei perni)
  lockedMap: any;
  // gruppi di base su cui insiste l'intersezione
  g1: string;
  g2: string;
}


/**
 * ALGORITMO
 * Swordfish
 *
 *
 *
 * fattore: +260
 */
export class SwordfishAlgorithm extends Algorithm {
  id = SWORDFISH_ALGORITHM;
  // Swordfish Area è più difficile da vedere e usare se sono molti i numeri mancanti
  factor = '+260';
  name = 'Swordfish';
  icon = 'set_meal';
  type = AlgorithmType.support;
  title = '...';
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    return applyAlgorithm(this, sdk, (o) => {

      const rank = sdk.sudoku?.rank || SUDOKU_DEFAULT_RANK;
      for (let n = 1; n < (rank + 1); n++) {
        const value = `${n}`;
        const positions = getNValuesGroups(sdk, value, (p) => p.length===2);
        if (positions.length>2) {
          for (let i = 0; i < positions.length - 2; i++) {
            for (let j = i + 1; j < positions.length - 1; j++) {
              for (let k = j + 1; k < positions.length; k++) {
                const vps = [positions[i], positions[j], positions[k]];
                const gids = vps.map(vp => vp.gid);
                const intersections = checkSwordfishPositions(vps);
                if (intersections.length > 0) {
                  const cids = _reduce(vps, (ids, vp) =>
                    [...ids, vp.cp1.cell.id, vp.cp2.cell.id], <string[]>[]);
                  intersections.forEach(int => {
                    const group = sdk.groups[int.gid];
                    if (group) {
                      group.cells
                        .map(cid => sdk.cells[cid])
                        .filter(c => isEmptyCell(c) && !int.lockedMap[c!.id])
                        .forEach(c => {
                          const removed = _remove(c!.availables, v => v === value);
                          if (removed.length > 0) {
                            // console.log('FOUND SWORDFISH\nGROUPS', vps,
                            //   '\nVALUE', value,
                            //   '\nINTERSECTION GROUP', group,
                            //   '\nMODIFIED CELL', c,
                            //   '\nINTERSECTIONS', intersections);
                            const args = <NotifyAppliedArgs>{
                              cid: c!.id,
                              removed,
                              cids,
                              gids
                            }
                            notifyApplied(this, o, args);
                          }
                        });
                    }
                  });
                }
              }
            }
          }
        }
      }
    });
  }
}

const checkSwordfishPositions = (vps: ValuePositions[]): Intersection[] => {
  // costruisce la mappa di tutte le celle perno
  const cellsMap: any = _reduce(vps, (m, vp) =>
    ({...m, [vp.cp1.cell.id]: true, [vp.cp2.cell.id]: true}), <any>{});
  // se le celle originali non sono tutte diverse annulla la ricerca
  if (_keys(cellsMap).length !== (vps.length * 2)) return [];

  const intrs: Dictionary<Intersection> = {};
  const gMap: any = _reduce(vps, (m, v) => ({...m, [v.gid]: true}), <any>{});

  // verifica sulle celle: tutte le celle devono essere non coincidenti
  // cicla tutte le possibili coppie dei gruppi
  for (let i = 0; i < vps.length - 1; i++) {
    for (let j = i + 1; j < vps.length; j++) {
      // i,j  =>  0,1   0,2   1,2
      // per ogni coppia deve esistere un'intersezione attraverso un gruppo che non è tra quelli di vps (gMap)
      const intr = getSwordFishIntersection(vps[i], vps[j], gMap);
      if (intr) intrs[intr.gid] = intr;
    }
  }

  // verifica: le intersezioni trovate devono essere 3 (ognuna su un gruppo diverso dalle altre
  // e non presente tra quelli originali (vps))
  const res = <Intersection[]>_values(intrs);
  return res.length === 3 ? res : [];
}

/**
 * restituisce un'intersezione possibile tra i due gruppi con le celle individuate (cp1 e cp2)
 * @param vp1
 * @param vp2
 * @param groupsMap
 */
const getSwordFishIntersection = (vp1: ValuePositions, vp2: ValuePositions, groupsMap: any): Intersection|undefined => {
  let intersection: Intersection|undefined = undefined;
  if (vp1.gid === vp2.gid) return intersection;
  // fra i due elementi deve esistere almeno una cella allineata su un intersezione ortogonale
  const i1s = [decodeCellId(vp1.cp1.cell.id), decodeCellId(vp1.cp2.cell.id)];
  const i2s = [decodeCellId(vp2.cp1.cell.id), decodeCellId(vp2.cp2.cell.id)];
  for (let i = 0; i < i1s.length; i++) {    //  0       1
    for (let j = 0; j < i2s.length; j++) {  //  0   1   0   1
      if (!intersection && i1s[i].id !== i2s[j].id) {
        // intersection group type
        const gt = ['col', 'row', 'sqr'].find(type =>
          (<any>i1s[i])[type] === (<any>i2s[j])[type] && !groupsMap[groupId(<SudokuGroupType>type, <number>(<any>i1s[i])[type])]);

        if (gt) {
          const gid = groupId(<SudokuGroupType>gt, <number>(<any>i1s[i])[gt]);
          // la lockedMap include le celle perni dell'intersezione
          const lockedMap: any = { [i1s[i].id]: true, [i2s[j].id]: true };
          intersection = { type: <SudokuGroupType>gt, pos: <number>(<any>i1s[i])[gt], gid, lockedMap, g1: vp1.gid, g2: vp2.gid  };
        }
      }
    }
  }
  return intersection;
}
