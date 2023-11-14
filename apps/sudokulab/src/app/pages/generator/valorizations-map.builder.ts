import {checkAvailable, getDynamicCells, PlaySudoku, PlaySudokuCell} from "@sudokulab/model";
import {cloneDeep as _clone, findLastIndex as _findLastIndex} from "lodash";
import {ValMap, ValuesForCells} from "./generator.model";

interface ValCell {
  cell: PlaySudokuCell;
  index: number;
}

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

interface CycleState {
  cycle: number;
}

/**
 * calcola il set di valori posssibili per le celle dinamiche
 * @param sdk
 * @param vcells
 * @param cycleState
 */
const _getNextValues = (sdk: PlaySudoku, vcells: ValCell[], cycleState: CycleState): ValuesForCells|undefined => {
  // nel ciclo successivo al primo incrementa l'ultimo indice di valorizzazione
  // valido ed esegue la generazione del set di valori
  if (cycleState.cycle > 0 && !_incrementLastAvailable(vcells)) return undefined;

  let failed = false;
  const vfc: ValuesForCells = {};
  const vsdk = _clone(sdk);
  _clearDynamicCells(vsdk, vcells);

  // valorizza le celle applicando le regole del sudoku
  vcells.forEach(vc => {
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

  // potrebbe fallire la valorizzazione se l'aggiornamento dei valori possibili in una
  // cella portasse a non avere più disponibile il valore all'indice richiesto
  // in tal caso passa automaticamente al ciclo successivo
  if (failed) {
    cycleState.cycle++;
    return _getNextValues(sdk, vcells, cycleState);
  }
  return vfc;
}


/**
 * Costruisce la mappa delle valorizzazioni
 * @param sdk
 * @param check
 */
export const buildValMap = (check: () => boolean, sdk?: PlaySudoku): ValMap => {
  const vMap = new ValMap();
  if (!sdk) return vMap.complete();
  // costruisce l'elenco delle celle dinamiche per la valorizzazione
  const vcells = getDynamicCells(sdk).map(cell => <ValCell>{cell, index: 0});
  // stato dei cicli (come oggetto perché è gestibile anche all'interno
  // della funzione _getNextValues)
  const cycleState: CycleState = { cycle: 0 };

  // ogni ciclo prevede la generazione di un set di valori possibili
  // per le celle dinamiche
  do {
    // calcola il set di valori
    const values = _getNextValues(sdk, vcells, cycleState);
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
  return vMap;
}
