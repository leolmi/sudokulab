import {Algorithm} from "../Algorithm";
import {applyAlgorithm, notifyApplied, NotifyAppliedArgs} from "./algorithms.common";
import {AlgorithmType} from "../enums";
import {PlaySudoku} from "../PlaySudoku";
import {AlgorithmResult} from "../AlgorithmResult";
import {getGroups, getUserCoord, isEmptyCell, traverseSchema} from "../../sudoku.helper";
import {PlaySudokuCell} from "../PlaySudokuCell";
import {keys as _keys, remove as _remove} from "lodash";

export const BUG_ALGORITHM = 'Bug';


/**
 * ALGORITMO BUG
 *
 * - se esiste una sola cella tra quelle ancora da valorizzare che può ospitare 3 valori
 * - e tutte le altre ancora da valorizzare ne possono ospitare solo 2
 * - ed uno dei tre valori è presente solo 2 volte in tutti i gruppi che intersecano la cella
 * allora questo valore può essere escluso dai valori possibili della cella stessa
 *
 * fattore: +160
 */
export class BugAlgorithm extends Algorithm {
  id = BUG_ALGORITHM;
  // Bug è più difficile da vedere e usare se sono molti i numeri mancanti
  factor = '+160';
  name = 'Bug';
  icon = 'bug_report';
  type = AlgorithmType.support;
  title = `se esiste una sola cella tra quelle ancora da valorizzare che può ospitare 3 valori e tutte le altre solo 2 ed uno dei tre valori\
  è presente solo 2 volte in tutti i gruppi che intersecano la cella allora questo può essere escluso dai valori possibili`;
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    return applyAlgorithm(this, sdk, (o) => {
      const cell = getBugCell(sdk);
      if (cell) {
        const value = getCellBugValue(sdk, cell);
        if (value) {
          const removed = _remove(cell.availables, v => v === value);
          if (removed.length>0) {
            const args = <NotifyAppliedArgs>{
              cid: cell.id,
              removed,
              desc: `Found ${this.name} on cell ${getUserCoord(cell.id)}, so [${removed.join(',')}] have been removed from this`,
              skipRemovedCheck: true
            };
            notifyApplied(this, o, args);
          }
        }
      }
    })
  }
}


const getBugCell = (sdk: PlaySudoku) => {
  const tCells: PlaySudokuCell[] = [];
  let hasBug = true;
  traverseSchema(sdk, (cid, cell) => {
    if (isEmptyCell(cell)) {
      if (cell!.availables.length===3) {
        tCells.push(<PlaySudokuCell>cell);
      } else if (cell!.availables.length!==2) {
        hasBug = false;
      }
    }
  });
  if (hasBug && tCells.length!==1) hasBug = false;
  return hasBug ? tCells[0] : undefined;
}

const getCellBugValue = (sdk: PlaySudoku, cell: PlaySudokuCell): string|undefined => {
  const groups = getGroups(sdk, [cell.id]);
  return cell.availables.find((v) => {
    // è un bug-value quando in ogni gruppo che interzeca la cella è presente 2 volte
    return !groups.find(g => _keys(g.availableOnCells[v]).length !== 2);
  });
}
