import {getRank, PlaySudoku, PlaySudokuCell} from "@sudokulab/model";
import {BOARD_WORKER_USER_DATA_KEY, BoardUserData, CellData, SchemaData} from "./board-worker.model";
import {cloneDeep as _clone, extend as _extend, find as _find, forEach as _forEach, reduce as _reduce} from "lodash";


const applyUserData = (sdk: PlaySudoku, data: BoardUserData): void => {
  const sdata = (data?.schema||{})[sdk._id];
  if (sdata) {
    sdk.state.valuesCount = sdk.state.fixedCount;
    _forEach(sdata.cells, (cell, cid) => {
      const tcell = sdk.cells[cid];
      if (tcell) {
        if (cell?.value) sdk.state.valuesCount++;
        tcell.value = cell?.value || '';
        tcell.pencil = cell?.pencil || [];
      }
    });
    const rank = getRank(sdk);
    const dimension = rank * rank;
    sdk.state.percent = ((sdk.state.valuesCount - sdk.state.fixedCount) / (dimension - sdk.state.fixedCount)) * 100;
  }
  if (sdata?.options) _extend(sdk.options, sdata.options);
}

/**
 * carica i dati utente
 */
export const getUserData = (): BoardUserData|undefined => {
  const udata_str = localStorage.getItem(BOARD_WORKER_USER_DATA_KEY);
  let udata: any;
  if (udata_str) {
    try {
      udata = JSON.parse(udata_str);
    } catch (err) {
      console.warn('cannot read user data for worker-board', err);
    }
  }
  return udata ? new BoardUserData(udata) : undefined;
}

/**
 * carica i dati utente sullo schema
 * @param sdk
 */
export const loadUserData = (sdk: PlaySudoku): PlaySudoku => {
  const udata = getUserData();
  const csdk = _clone(sdk);
  if (udata) applyUserData(csdk, udata);
  return csdk;
}

const getCellData = (cell: PlaySudokuCell|undefined): CellData|undefined => {
  if (cell?.fixed) return undefined;
  if (cell?.value) return { value: cell?.value };
  if ((cell?.pencil||[]).length>0) return { pencil: cell?.pencil };
  return undefined;
}

const getSchemaData = (sdk: PlaySudoku): SchemaData => {
  return {
    cells: _reduce(sdk.cells, (a, c) => {
      const cdata = getCellData(c);
      return cdata ? {...a, [c?.id || '']: cdata} : a;
    }, {}),
    options: sdk.options
  }
}

/**
 * lo schema è vuoto se non trova alcuna valorizzazione delle celle o delle matite
 * @param data
 */
const isEmptySchema = (data: SchemaData): boolean => {
  return !_find(data.cells, (c) => !!c);
}

/**
 * salva i dati utente
 * @param sdk
 */
export const saveUserData = (sdk: PlaySudoku): BoardUserData => {
  const udata = getUserData();
  const data = new BoardUserData(udata);
  const sdata = getSchemaData(sdk);
  if (!isEmptySchema(sdata)) {
    data.schema[sdk._id] = sdata;
  } else {
    delete data.schema[sdk._id];
  }
  localStorage.setItem(BOARD_WORKER_USER_DATA_KEY, JSON.stringify(data));
  return data;
}
