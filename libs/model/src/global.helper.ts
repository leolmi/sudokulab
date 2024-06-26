import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {
  cloneDeep as _clone,
  extend as _extend,
  get as _get,
  isString as _isString,
  reduce as _reduce,
  set as _set,
  trimEnd as _trimEnd,
  trimStart as _trimStart
} from 'lodash';
import {SudokulabWindowService} from './lib/services';
import {
  DYNAMIC_VALUES,
  SDK_PREFIX,
  SDK_PREFIX_DEBUG,
  SUDOKU_COMPACT_WIDTH_1,
  SUDOKU_COMPACT_WIDTH_2, SUDOKU_STANDARD_CHARACTERS,
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

export const useOn = <T>(o$: Observable<T>,
                         t$: BehaviorSubject<T>,
                         destroyer$: Observable<any>,
                         h?: (o: T) => any): Subscription|null => {
  if (!o$) return null;
  return o$.pipe(takeUntil(destroyer$)).subscribe(ov => {
    const cov = _clone(ov);
    t$.next(cov);
    if (!!h) h(cov);
  });
}

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
  !!o && !!c && JSON.stringify(o) !== JSON.stringify(c);

export const isCompact = (ws: SudokulabWindowService): boolean => (ws.nativeWindow?.innerWidth || 2000) < SUDOKU_COMPACT_WIDTH_1;

/**
 * Livello di compattezza
 * @param ws
 */
export const getCompactLevel = (ws: SudokulabWindowService): number => {
  const winSize = ws.nativeWindow?.innerWidth || 2000;
  if (winSize <= SUDOKU_COMPACT_WIDTH_2) return 2;
  if (winSize <= SUDOKU_COMPACT_WIDTH_1) return 1;
  return 0;
}


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

export interface SettingsChanges {
  path: string;
  data: any;
}

export const saveUserSetting = (changes: SettingsChanges[]) => {
  const userdata = localStorage.getItem(SUDOKULAB_SETTINGS_KEY);
  try {
    const udata: any = userdata ? JSON.parse(userdata||'{}') : {};
    changes.forEach(c => _set(udata, c.path, c.data));
    debug(() => console.log(...SDK_PREFIX_DEBUG, 'SAVE USER SETTINGS', udata), 'user-data');
    localStorage.setItem(SUDOKULAB_SETTINGS_KEY, JSON.stringify(udata));
  } catch (err) {
    console.warn(SDK_PREFIX, 'Cannot save user data!', err);
  }
}

export const clearUserSettings = () => {
  localStorage.removeItem(SUDOKULAB_SETTINGS_KEY);
}

export const addLine = (original: string, line: string, separator = '\n'): string => {
  return original ? `${original}${separator}${line}` : line;
}

export const setDebugMode = (on = true) => {
  try {
    localStorage.setItem(SUDOKULAB_DEBUG_KEY, on ? 'active' : '')
  } catch (err) {
    console.log(err)
  }
}
export const isDebugMode = (level?: string) => {
  try {
    const debug_status = localStorage.getItem(SUDOKULAB_DEBUG_KEY)
    return !!level ? debug_status === level : !!debug_status;
  } catch (err) {
    return false;
  }
};
export const debug = (handler: () => any, level?: string): void => isDebugMode(level) ? handler() : null;

/**
 * Restituisce vero se il valore rappresenta una cella dinamica
 * @param v
 */
export const isDynamic = (v: string) => [...DYNAMIC_VALUES].indexOf(v)>-1;

export const isValue = (v?: string, acceptX = false): boolean => {
  const effv = (v || '').trim();
  return effv !== '' && effv !== SUDOKU_STANDARD_CHARACTERS.empty && (acceptX || !isDynamic(effv));
}

export const calcFixedCount = (fixed?: string): number =>
  _reduce((fixed || ''), (c, v) => isValue(v) ? c + 1 : c, 0);

export const combine = (...args: string[]): string => {
  args.forEach((a, i) => {
    if (i < args.length - 1) a = _trimEnd(a, '/');
    if (i > 0) a = _trimStart(a, '/');
    args[i] = a;
  });
  return args.join('/');
}

/**
 * Vero se il browser supporta gli worker web
 */
export const isWorkerEnabled = () => typeof(Worker) !== "undefined";

/**
 * restituisce il messaggio d'errore
 * @param err
 */
export const getErrorMessage = (err: any): string => {
  if ((<Error>err).message) return err.message;
  return 'Generic error';
}
