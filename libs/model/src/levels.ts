import { SUDOKU_DEBUG_LEVELS_KEY } from './lib';
import { BehaviorSubject } from 'rxjs';
import { remove as _remove} from 'lodash';

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
  //static levels$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(getLevels());

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
    //this.levels$.next(levels);
  }

  static clear = () => {
    localStorage.removeItem(SUDOKU_DEBUG_LEVELS_KEY);
    //this.levels$.next([]);
  }

  /**
   * vero se almeno uno dei livelli `ls` è attivo
   * @param ls
   */
  static isLevel = (...ls: string[]): boolean => {
    const levels = getLevels();
    return !!(ls || []).find(l => levels.includes(sanitizeLevel(l)));
  }
}


