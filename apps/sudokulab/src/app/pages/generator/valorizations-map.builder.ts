import {
  checkAvailable,
  getDynamicCells,
  PlaySudoku,
  PlaySudokuCell,
  SUDOKU_DEFAULT_MAX_VAL_CYCLES,
  SUDOKU_DEFAULT_MAXSPLIT
} from "@sudokulab/model";
import {cloneDeep as _clone, findLastIndex as _findLastIndex, random as _random} from "lodash";
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
 * calcola il set di valori posssibili per le celle dinamiche
 * @param sdk
 * @param vMap
 * @param check
 */
const _getNextValues = (sdk: PlaySudoku, vMap: ValMap, check: () => boolean): ValuesForCells|undefined => {
  // nel ciclo successivo al primo incrementa l'ultimo indice di valorizzazione
  // valido ed esegue la generazione del set di valori
  if (vMap.valCycle > 0 && !_incrementLastAvailable(vMap.valCells)) return undefined;

  let failed = false;
  const vfc: ValuesForCells = {};
  const vsdk = _clone(sdk);
  _clearDynamicCells(vsdk, vMap.valCells);
  if (!check()) return vfc;

  do {
    failed = false;
    const randomCells = _getRandomCells(vMap.valCells);
    // valorizza le celle applicando le regole del sudoku
    randomCells.forEach(vc => {
      const sc = vsdk.cells[vc.cell.id];
      if (sc && !failed) {
        // const av = sc.availables[vc.index];
        // sceglie in modo casuale un valore possibile fra quelli disponibili
        const ri = _random(sc.availables.length-1);
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
    vMap.valCycle++;
  } while(check() && !failed && (vMap.valCycle<(sdk.options?.generator?.maxValCycles||SUDOKU_DEFAULT_MAX_VAL_CYCLES)));

  // valorizza le celle applicando le regole del sudoku
  // vMap.valCells.forEach(vc => {
  //   const sc = vsdk.cells[vc.cell.id];
  //   if (sc && !failed) {
  //     const av = sc.availables[vc.index];
  //     if (av) {
  //       sc.value = av;
  //       vfc[sc.id] = av;
  //     } else {
  //       failed = true;
  //     }
  //   } else {
  //     failed = true;
  //   }
  //   if (!failed) checkAvailable(vsdk);
  // });

  // potrebbe fallire la valorizzazione se l'aggiornamento dei valori possibili in una
  // cella portasse a non avere più disponibile il valore all'indice richiesto
  // in tal caso passa automaticamente al ciclo successivo
  // if (failed) return _getNextValues(sdk, vMap);
  return vfc;
}


/**
 * Costruisce la mappa delle valorizzazioni
 *
 * ogni ciclo prevede la generazione di un set di valori possibili
 *
 *  // stato dei cicli (come oggetto perché è gestibile anche all'interno
    // della funzione _getNextValues)
    // const cycleState: CycleState = { cycle: 0 };
    //per le celle dinamiche
    do {
      // calcola il set di valori
      const values = _getNextValues(sdk, vMap);
      // se il set esiste e il generatore è attivo
      if (values && check()) {
        // aggiunge il set di valori
        vMap.valuesForCells.push(values);
        // incrementa il ciclo
        cycleState.cycle++;
      } else {
        // quando non esistono più set di valori possibili esce
        vMap.complete();
      }
    } while (!vMap.isComplete);
 *
 *
 * @param sdk
 * @param check
 */
export const buildValMap = (sdk: PlaySudoku|undefined, check: () => boolean): ValMap => {
  const vMap = new ValMap();
  if (!sdk) return vMap.complete();
  // costruisce l'elenco delle celle dinamiche per la valorizzazione
  vMap.valCells = getDynamicCells(sdk).map(cell => <ValCell>{cell, index: 0});
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
    const values = _getNextValues(sdk, vMap, check);
    // incrementa il ciclo
    vMap.cycle++;
    if (values) {
      // aggiunge il set di valori
      vMap.valuesForCells.push(values);
    } else {
      // quando non esistono più set di valori possibili chiude la mappa
      vMap.complete();
    }
  }
}
