import { SUDOKU_DEBUG_LEVELS_KEY } from './lib';
import { remove as _remove } from 'lodash';
import { BehaviorSubject, map } from 'rxjs';

const sanitizeLevel = (l: string): string => `${l||''}`.trim().toLowerCase();

const getLevels = (): string[] => {
  const levels = localStorage.getItem(SUDOKU_DEBUG_LEVELS_KEY)||'';
  return levels
    .split(',')
    .map(l => sanitizeLevel(l))
    .filter(l => !!l);
}

const setLevels = (levels: string[]) => localStorage.setItem(SUDOKU_DEBUG_LEVELS_KEY, levels.join(','));

/**
 * contesto per le opzioni utente
 */
export class LocalContext {
  static changed$: BehaviorSubject<any> = new BehaviorSubject<any>({});
  static toggleLevel = (...ls: string[]) => {
    const levels = getLevels();
    ls.map(l => sanitizeLevel(l)).forEach(sl => {
      if (levels.includes(sl)) {
        _remove(levels, l => l===sl);
      } else {
        levels.push(sl);
      }
    });
    setLevels(levels);
    this.changed$.next({});
  }

  static clear = () => {
    localStorage.removeItem(SUDOKU_DEBUG_LEVELS_KEY);
    this.changed$.next({});
  }

  /**
   * vero se almeno uno dei livelli `ls` è attivo
   * @param ls
   */
  static isLevel = (...ls: string[]): boolean => {
    const levels = getLevels();
    return !!(ls || []).find(l => levels.includes(sanitizeLevel(l)));
  }

  static isDebugMode$ = LocalContext.changed$.pipe(map(() => LocalContext.isLevel('debug')));
}


