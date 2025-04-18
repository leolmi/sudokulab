import {
  get as _get,
  keys as _keys,
  isString as _isString,
  reduce as _reduce,
  startCase as _startCase,
  sortBy as _sortBy
} from 'lodash';
import { MenuItem } from '../model';
import { BoardManager, BoardStatus } from '@olmi/board';
import { Router } from '@angular/router';
import { SudokuState } from '../app.state';
import { getStandardSchemaName, Sudoku, SudokuStat } from '@olmi/model';
import { saveAs } from 'file-saver';

export class StatLine {
  description: string = '';
  value: string = '';
  index: number = 0;
  evidence?: boolean;
}

/**
 * calcola il testo con bookmarks `{xxx}`
 * @param text
 * @param scope
 */
export const calcText = (text: string, scope: any): string => {
  return text.replace(/\{(.*?)}/g, (m, path) => `${_get(scope, path)||''}`);
}

/**
 * calcola lo stato standard per le voci di menu
 * @param menu
 * @param bs
 */
export const calcMenuStatus = (menu: MenuItem[], bs: any): any => {
  return _reduce(menu, (s, o) => {
    if (o.logic === 'switch') s[o.code||''] = !!bs[o.property||''];
    if (o.isDynamicText) s[`caption_${o.code||''}`] = calcText(o.text||'', { value: bs[o.property||''] });
    if (o.logic === 'execute') s[o.code||''] = !!bs[o.property||''];
    return s;
  }, <any>{});
}

/**
 * valori successivi per le voci standard
 * @param s
 * @param pn
 */
export const getNextValue = (s: any, pn: string): any => {
  const value = s[pn];
  switch (pn) {
    case 'editMode':
      return value === 'play' ? 'schema' : 'play';
    case 'valuesMode':
      return value === 'numbers' ? 'dots' : 'numbers';
    case 'nextMode':
      return value === 'none' ? 'next-in-row' :
        (value === 'next-in-row') ? 'next-in-square' :
          'none';
    default:
      return value;
  }
}

/**
 * gestione standard delle voci di menu
 * @param router
 * @param state
 * @param item
 * @param manager
 * @param privateHandler
 */
export const defaultHandleMenuItem = (router: Router, state: SudokuState, item: MenuItem, manager?: BoardManager, privateHandler?: (item: MenuItem) => void) => {
  switch (item.logic) {
    case 'navigate':
      router.navigate([item.property]);
      break;
    case 'switch': {
      const status = state.status$.value;
      if (item.property) manager?.options(<Partial<BoardStatus>>{ [item.property]: !_get(status, <string>item.code) });
      break;
    }
    case 'toggle': {
      const status: any = manager?.status$.value || {};
      if (item.property) manager?.options(<Partial<BoardStatus>>{ [item.property]: getNextValue(status, item.property) });
      break;
    }
    case 'private': {
      if (privateHandler) privateHandler(item);
      break;
    }
    default:
      if(item.operation) manager?.execOperation(item.operation);
      break;
  }
}


const getStatLineValue = (stat: SudokuStat, pn: string): any => {
  switch (pn) {
    case 'percent':
      return `${stat.percent.toFixed(0)}%`;
    case 'rank':
      return stat.rankStr;
    default:
      return (<any>stat)[pn];
  }
}

export interface StatOptions {
  hidden?: any;
  visible?: any;
}

export const getStatLines = (stat: SudokuStat, o: StatOptions): StatLine[] => {
  const vks = _keys(o.visible);
  const lines = _keys(stat)
    .filter(k => (!o.hidden || !(o.hidden||{})[k]) && (!o.visible || !!(o.visible||{})[k]))
    .map((k, i) => {
      return <StatLine>{
        description: _isString(o.visible[k]) ? o.visible[k] : _startCase(k),
        value: getStatLineValue(stat, k),
        index: o.visible[k] ? vks.indexOf(k) : i
      }
    });
  return _sortBy(lines, ['index']);
}

export const downloadSchema = (sdk?: Sudoku): void => {
  if (!sdk) return;
  const name = getStandardSchemaName(sdk);
  const filename = `${name}.json`;
  const schema_str = JSON.stringify(sdk, null, 2);
  const blob = new Blob([schema_str], { type: "application/json;" });
  saveAs(blob, filename);
}
