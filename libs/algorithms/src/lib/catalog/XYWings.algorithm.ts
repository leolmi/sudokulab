import { Algorithm, AlgorithmOptions, AlgorithmResult, AlgorithmType, SudokuCell } from '@olmi/model';
import { applyAlgorithm } from '../algorithms.common';

export const XYWINGS_ALGORITHM = 'XYWings';

/**
 * ALGORITMO XY-Wings
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
  title = 'XY-Wings';
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {

      // TODO...


    })
}


// import {Algorithm} from "../Algorithm";
// import {AlgorithmType} from "../enums";
// import {PlaySudoku} from "../PlaySudoku";
// import {AlgorithmResult, AlgorithmResultLine} from "../AlgorithmResult";
// import {
//   applyAlgorithm,
//   findCommonAffectedCells,
//   hasNAvailable,
//   notifyApplied,
//   NotifyAppliedArgs,
//   onCells
// } from "./algorithms.common";
// import {PlaySudokuCell} from "../PlaySudokuCell";
// import {getUserCoord} from "../../sudoku.helper";
// import {remove as _remove} from 'lodash';
//
// export const XYWINGS_ALGORITHM = 'XYWings';
//
// /**
//  * ALGORITMO
//  * XY-Wings
//  *
//  *
//  *
//  * fattore: +190
//  */
// export class XYWingsAlgorithm extends Algorithm {
//   id = XYWINGS_ALGORITHM;
//   // xy-wings è più difficile da vedere e usare se sono molti i numeri mancanti
//   factor = '+190';
//   name = 'XY-Wings';
//   icon = 'widgets';
//   type = AlgorithmType.support;
//   title = '...';
//   description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
//   apply = (sdk: PlaySudoku): AlgorithmResult => {
//     return applyAlgorithm(this, sdk, (o) => {
//       onCells(sdk, (c1) => {
//         if (c1 && hasNAvailable(c1)) {
//           const [x, y] = c1.availables;
//           // Trova due celle "wings" collegate al pivot
//           const wings = findXYWingWings(sdk, c1);
//           if (wings.length > 1) {
//             for (let i = 0; i < wings.length - 1; i++) {
//               for (let j = i + 1; j < wings.length; j++) {
//                 const wing1 = wings[i];
//                 const wing2 = wings[j];
//                 if (
//                   wing1.availables.length === 2 &&
//                   wing2.availables.length === 2 &&
//                   wing1.availables.includes(x) &&
//                   wing1.availables.includes(y) &&
//                   wing2.availables.includes(x) &&
//                   wing2.availables.includes(y)) {
//                   // Candidato comune
//                   const shared = wing1.availables.find(c => wing2.availables.includes(c));
//                   if (shared) {
//                     const afected = findCommonAffectedCells(sdk, wing1, wing2);
//                     afected.forEach(ac => {
//                       const removed = _remove(ac.availables || [], v => v === shared);
//                       const args = <NotifyAppliedArgs>{
//                         cid: ac.id,
//                         cids: [c1.id, wing1.id, wing2.id],
//                         removed
//                       };
//                       notifyApplied(this, o, args);
//                     });
//                   }
//                 }
//               }
//             }
//           }
//         }
//       });
//     });
//   }
// }
//
// const findXYWingWings = (sdk: PlaySudoku, pivot: PlaySudokuCell): PlaySudokuCell[] => {
//   const wings: PlaySudokuCell[] = [];
//   onCells(sdk, (c) => {
//     // La cella deve avere esattamente 2 candidati e condividere uno dei candidati con il pivot
//     if (c && hasNAvailable(c) && c.availables.some(v => pivot.availables.includes(v))) {
//       wings.push(c);
//     }
//   }, [pivot]);
//   return wings;
// }
