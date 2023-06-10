import {keys as _keys} from 'lodash';
import {Algorithm} from "../Algorithm";
import {AlgorithmType} from "../enums";
import {PlaySudoku} from "../PlaySudoku";
import {AlgorithmResult, AlgorithmResultLine} from "../AlgorithmResult";
import {Dictionary} from "@ngrx/entity";

export const COUPLES_ALGORITHM = 'Couples';

/**
 * ALGORITMO DELLE COPPIE
 *
 * esclude valori in celle risultanti dall'incrocio di coppie presenti in altri gruppi.
 *
 */
export class CouplesAlgorithm extends Algorithm {
  id = COUPLES_ALGORITHM;
  factor = '+80';
  name = 'Couples over groups';
  icon = 'move_down';
  type = AlgorithmType.support;
  title = 'quando coppie di valori producono allineamenti su uno dei valori possono far si che sia possibile escludere un valore da celle eserne ai gruppi considerati';
  description = 'Abbastanza complesso non risolve un valore di una cella ma contribuisce con i precedenti';
  apply = (sdk: PlaySudoku): AlgorithmResult => {

    let applied = false;
    const descLines: AlgorithmResultLine[] = [];
    const cells: Dictionary<boolean> = {};

    // TODO...

    // 1. ricerca di coppie di valori complementari in 2 gruppi diversi:
    //    - incrociati (ro & col, row & grooup, col & group);
    //    - paralleli (2 row, 2 col) corrispondenti, cioè dove le coppie si "vedono" a vicenda;
    // 2. esclusione di valori sulle celle che "vedono" contemporaneamente 2 celle condivise


    return new AlgorithmResult({
      algorithm: this.id,
      applied,
      descLines,
      cells: _keys(cells)
    }, sdk);
  }
}
