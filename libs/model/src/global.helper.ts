import { BehaviorSubject, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  cloneDeep as _clone,
  extend as _extend,
  get as _get,
  isEqual as _isEqual,
  isString as _isString,
  keys as _keys,
  set as _set
} from 'lodash';
import { SudokulabWindowService } from './lib/services';
import {
  SDK_PREFIX,
  SDK_PREFIX_DEBUG,
  SUDOKU_COMPACT_WIDTH,
  SUDOKULAB_DARK_THEME,
  SUDOKULAB_DEBUG_KEY,
  SUDOKULAB_LIGHT_THEME,
  SUDOKULAB_SETTINGS_KEY
} from './lib/consts';

export function guid(): string {
  return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, c => {
    /* tslint:disable */
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    /* tslint:enable */
  });
}

export const setApplicationTheme = (wins: SudokulabWindowService, theme: string) => {
  const thm = theme === SUDOKULAB_DARK_THEME ? SUDOKULAB_DARK_THEME : SUDOKULAB_LIGHT_THEME;
  const othm = thm === SUDOKULAB_DARK_THEME ? SUDOKULAB_LIGHT_THEME : SUDOKULAB_DARK_THEME;
  wins.nativeWindow.document.body.classList.remove(`theme-${othm}`);
  wins.nativeWindow.document.body.classList.add(`theme-${thm}`);
}

export const use = <T>(o$: Observable<T>, handler: (o:T) => any): any => o$.pipe(take(1)).subscribe(o => handler(o));

export const getHash = (o: any): number => {
  o = o || '';
  if (!_isString(o)) {
    o = JSON.stringify(o);
  }
  let hash = 0, i, chr;
  if (o.length === 0) {
    return hash;
  }
  for (i = 0; i < o.length; i++) {
    chr = o.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

export const update = <T>(o: T, chs?: Partial<T>, handler?: (c:T) => void): T => {
  const co = <T>_clone(o||{});
  if (!!chs) _extend(co, chs||{});
  if (!!handler) handler(co);
  return co;
}

export const updateBehaviorSubject = <T>(bs$: BehaviorSubject<T>, handler: (c: T) => boolean): void =>
  use(bs$, o => {
    const co = _clone(o);
    if (handler(co)) bs$.next(co);
  });

export const isMutation = (o: any, c: any): boolean =>
  !!o && !!c && !!_keys(c||{}).find(k => !_isEqual(c[k],o[k]));

export const isCompact = (ws: SudokulabWindowService): boolean => (ws.nativeWindow?.innerWidth || 2000) < SUDOKU_COMPACT_WIDTH;


export const getUserSetting = <T>(path: string): T|undefined => {
  const userdata = localStorage.getItem(SUDOKULAB_SETTINGS_KEY);
  try {
    const udata = JSON.parse(userdata||'{}');
    return <T>_get(udata||{}, path);
  } catch (err) {
    console.warn(SDK_PREFIX, 'Corrupted user data!', userdata);
  }
  return undefined;
}

export const saveUserSetting = (path: string, data: any) => {
  const userdata = localStorage.getItem(SUDOKULAB_SETTINGS_KEY);
  try {
    const udata: any = userdata ? JSON.parse(userdata||'{}') : {};
    _set(udata, path, data);
    debug(() => console.log(...SDK_PREFIX_DEBUG, 'SAVE USER SETTINGS', udata));
    localStorage.setItem(SUDOKULAB_SETTINGS_KEY, JSON.stringify(udata));
  } catch (err) {
    console.warn(SDK_PREFIX, 'Cannot save user data!', err);
  }
}

export const addLine = (original: string, line: string, separator = '\n'): string => {
  return original ? `${original}${separator}${line}` : line;
}

export const setDebugMode = (on = true) => localStorage.setItem(SUDOKULAB_DEBUG_KEY, on ? 'active' : '');
export const isDebugMode = () => localStorage.getItem(SUDOKULAB_DEBUG_KEY) === 'active';
export const debug = (handler: () => any): void => isDebugMode() ? handler() : null;
