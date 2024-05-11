import {
  checkAvailable,
  getDynamicCells,
  PlaySudoku,
  SUDOKU_DEFAULT_MAX_VAL_CYCLES,
  SUDOKU_DEFAULT_MAX_VAL_CYCLES_FACTOR,
  SudokuValorizationMode
} from "@sudokulab/model";
import {
  cloneDeep as _clone,
  findLastIndex as _findLastIndex,
  isEmpty as _isEmpty,
  keys as _keys,
  random as _random
} from "lodash";
import {ValCell, ValMap, ValuesForCells} from "./generator.model";

/**
 * incrementa l'ultimo indice di valorizzazione valido
 * @param cells
 */
const _incrementLastAvailable = (cells: ValCell[]): boolean => {
  // ricerca l'indice dell'ultima cella che ha ancora
  // la possibilità di incrementare l'indice di valorizzazione
  const ci = _findLastIndex(cells, (c) => c.index < (c.cell.availables.length - 1));
  if (ci < 0) return false;
  const count = cells.length;
  cells[ci].index++;
  // le celle successive vengono resettate nell'indice
  for (let i = ci + 1; i < count; i++) {
    cells[i].index = 0;
  }
  return true;
}

/**
 * elimina i valori dinamici delle celle
 * @param sdk
 * @param cells
 */
const _clearDynamicCells = (sdk: PlaySudoku, cells: ValCell[]) => {
  cells.forEach(c => {
    const cell = sdk.cells[c.cell.id];
    if (cell) cell.value = '';
  })
}

/**
 * crea un elenco casuale delle celle da valorizzare
 * @param cells
 */
const _getRandomCells = (cells: ValCell[]): ValCell[] => {
  const length = cells.length;
  const source = [...cells];
  return [...Array(length)].map(() => {
    const index = _random(source.length-1);
    return source.splice(index, 1)[0];
  });
}

/**
 * restituisce la rappresentazione stringa del set di valori
 * @param vfc
 */
const _getValuesKey = (vfc: ValuesForCells): string|undefined => {
  if (!vfc || _isEmpty(vfc)) return undefined;
  return _keys(vfc).join('.');
}

/**
 * valorizza il set utilizzando i valori possibili delle celle dinamiche
 * scelti in modo casuale
 * @param vsdk
 * @param vMap
 * @param vfc
 */
const _randomValuesForCells = (vsdk: PlaySudoku, vMap: ValMap, vfc: ValuesForCells): boolean => {
  let failed = false;
  const randomCells = _getRandomCells(vMap.valCells);
  // valorizza le celle applicando le regole del sudoku
  randomCells.forEach(vc => {
    const sc = vsdk.cells[vc.cell.id];
    if (sc && !failed) {
      // const av = sc.availables[vc.index];
      // sceglie in modo casuale un valore possibile fra quelli disponibili
      const ri = _random(sc.availables.length - 1);
      const av = sc.availables[ri];
      if (av) {
        sc.value = av;
        vfc[sc.id] = av;
      } else {
        failed = true;
      }
    } else {
      failed = true;
    }
    if (!failed) checkAvailable(vsdk);
  });
  return !failed;
}

/**
 * valorizza il set utilizzando i valori possibili delle celle dinamiche
 * scelti in modo sequenziale
 * @param vsdk
 * @param vMap
 * @param vfc
 */
const _sequentialValuesForCells = (vsdk: PlaySudoku, vMap: ValMap, vfc: ValuesForCells): boolean => {
  let failed = false;
  // incrementa gli indici sequenziali dal secondo ciclo
  if (vMap.cycle > 0 && !_incrementLastAvailable(vMap.valCells)) return false;
  // valorizza il set
  vMap.valCells.forEach(vc => {
    const sc = vsdk.cells[vc.cell.id];
    if (sc && !failed) {
      const av = sc.availables[vc.index];
      if (av) {
        sc.value = av;
        vfc[sc.id] = av;
      } else {
        failed = true;
      }
    } else {
      failed = true;
    }
    if (!failed) checkAvailable(vsdk);
  });
  return !failed;
}

/**
 * calcola il set di valori posssibili per le celle dinamiche
 * @param sdk
 * @param vMap
 * @param check
 */
const _getNextValues = (sdk: PlaySudoku, vMap: ValMap, check: () => boolean): ValuesForCells|undefined => {
  // resetta il set di valori
  vMap.valuesForCells = undefined;
  let failed = false;
  const vfc: ValuesForCells = {};
  const vsdk = _clone(sdk);
  _clearDynamicCells(vsdk, vMap.valCells);
  if (!check()) return vfc;
  const limit = sdk.options?.generator?.maxValCycles || SUDOKU_DEFAULT_MAX_VAL_CYCLES;
  do {
    failed = vMap.isRandomValues ?
      // valorizza il set secondo la logica casuale
      !_randomValuesForCells(vsdk, vMap, vfc) :
      // valorizza il set secondo la logica sequenziale
      !_sequentialValuesForCells(vsdk, vMap, vfc);
    // incrementa i cicli
    vMap.cycle++;
    // trasforma in stringa il set
    const vk = _getValuesKey(vfc);
    if (!vk || vMap.cache[vk]) {
      failed = true;
    } else {
      vMap.cache[vk] = true;
    }
  } while (check() && !failed && vMap.cycle < limit);

  // potrebbe fallire la valorizzazione se l'aggiornamento dei valori possibili in una
  // cella portasse a non avere più disponibile il valore all'indice richiesto
  // in tal caso passa automaticamente al ciclo successivo
  return vfc;
}

/**
 * determina la casualità del calcolo del set di valori
 * @param vMap
 * @param sdk
 */
const _calcRandomValues = (vMap: ValMap, sdk: PlaySudoku): boolean => {
  vMap.maxValCycles = sdk?.options?.generator?.maxValCycles || SUDOKU_DEFAULT_MAX_VAL_CYCLES;
  switch (sdk?.options?.generator?.valCyclesMode || SudokuValorizationMode.auto) {
    case SudokuValorizationMode.random:
      return true;
    case SudokuValorizationMode.sequential:
      return false;
    default:
      // la modalità di determinazione dei set dei valori diventa casuale
      // quando il numero delle possibili valorizzazioni supera il massimo dei
      // cicli disponibili
      let rnd = false;
      const max = vMap.maxValCycles * SUDOKU_DEFAULT_MAX_VAL_CYCLES_FACTOR;
      let vci = 0, pv = 1;
      if ((vMap.valCells || []).length > 0) {
        do {
          const c = vMap.valCells[vci];
          pv = pv * c.cell.availables.length;
          if (pv > max) rnd = true;
          vci++;
        } while (pv < max && vci < vMap.valCells.length);
      }
      vMap.maxValCycles = Math.min(pv, vMap.maxValCycles);
      return rnd;
  }
}

/**
 * Costruisce la mappa delle valorizzazioni
 *
 * ogni ciclo prevede la generazione di un set di valori possibili
 * @param sdk
 * @param check
 */
export const buildValMap = (sdk: PlaySudoku|undefined, check: () => boolean): ValMap => {
  const vMap = new ValMap();
  if (!sdk) return vMap.complete();
  // costruisce l'elenco delle celle dinamiche per la valorizzazione
  vMap.valCells = getDynamicCells(sdk).map(cell => <ValCell>{cell, index: 0});
  vMap.isRandomValues = _calcRandomValues(vMap, sdk);
  nextValMap(vMap, sdk, check);
  return vMap;
}

/**
 * secondo step sequenziale di valorizzazione
 * @param vMap
 * @param sdk
 * @param check
 */
export const nextValMap = (vMap: ValMap, sdk: PlaySudoku|undefined, check: () => boolean): void => {
  if (!sdk) {
    vMap.complete();
  } else {
    vMap.valuesForCells = _getNextValues(sdk, vMap, check);
    if (!vMap.valuesForCells) {
      // quando non esistono più set di valori possibili chiude la mappa
      vMap.complete();
    }
  }
}
