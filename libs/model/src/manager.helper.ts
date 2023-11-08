import {SudokuData} from "./lib/tokens";
import {PlaySudoku} from "./lib/PlaySudoku";
import {PlaySudokuCell} from "./lib/PlaySudokuCell";
import {isObservable, Observable} from "rxjs";
import {take} from "rxjs/operators";
import {cloneDeep as _clone} from 'lodash';
import {applyCellValue, cellId, clearEvent, isDirectionKey, moveOnDirection} from "./sudoku.helper";

export class Chainable {
  private _completed = false;
  private _then: (() => any)|undefined = undefined;
  complete = () => this._completed = true;
  next = (timeout = 10) => {
    if (this._completed) return;
    this._completed = true;
    setTimeout(() => !!this._then ? this._then() : null, timeout);
  }
  then = (handler: () => any) => this._then = handler;
}


/**
 * gestione dello schema
 * @param chn
 * @param data
 * @param sdk
 * @param handled
 */
const handleSchemaChainable = (chn: Chainable, data: SudokuData<any>, sdk: PlaySudoku, handled: boolean) => {
  if (handled) {
    data.sdk$.next(sdk);
    chn.next();
  } else {
    chn.complete();
  }
}

/**
 * Aggiorna lo schema del BoardData
 * @param data
 * @param handler
 */
export const updateSchema = (data: SudokuData<any>, handler: (sdk: PlaySudoku, cell?: PlaySudokuCell) => boolean|Observable<boolean>): Chainable => {
  const chn = new Chainable();
  if (data.disabled$.value) {
    chn.complete();
  } else {
    const sdk = _clone(data.sdk$.value);
    const cell = sdk.cells[data.activeCellId$.value];
    const result = handler(sdk, cell);
    if (isObservable(result)) {
      result
        .pipe(take(1))
        .subscribe(r => handleSchemaChainable(chn, data, sdk, r));
    } else {
      handleSchemaChainable(chn, data, sdk, result);
    }
  }
  return chn;
}


/**
 * gestisce gli eventi da tastiera su un BoardData
 * @param data
 * @param e
 */
export const handleKeyEvent = (data: SudokuData<any>, e: KeyboardEvent): PlaySudoku|undefined => {
  if (data.disabled$.value) return undefined;
  let sdk = data.sdk$.value;
  if (isDirectionKey(e?.key)) {
    clearEvent(e);
    const target = moveOnDirection(data.activeCellId$.value, sdk.sudoku, e?.key);
    const cid = cellId(target?.col || 0, target?.row || 0);
    data.activeCellId$.next(cid);
    return undefined;
  } else {
    updateSchema(data, (sdk, cell) =>
      applyCellValue(cell, e?.key||'', sdk.options));
    return data.sdk$.value;
  }
}
