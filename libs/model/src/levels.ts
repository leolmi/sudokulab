import { computed, signal, Signal } from '@angular/core';
import { remove as _remove } from 'lodash';
import { SUDOKU_DEBUG_LEVELS_KEY } from './lib';

const sanitizeLevel = (l: string): string => `${l || ''}`.trim().toLowerCase();

const getLevels = (): string[] => {
  const levels = localStorage.getItem(SUDOKU_DEBUG_LEVELS_KEY) || '';
  return levels
    .split(',')
    .map(l => sanitizeLevel(l))
    .filter(l => !!l);
};

const setLevels = (levels: string[]) => localStorage.setItem(SUDOKU_DEBUG_LEVELS_KEY, levels.join(','));

/**
 * Contesto delle opzioni utente persistite in localStorage (debug levels).
 * Espone `isDebugMode` come `Signal<boolean>` per i consumer reattivi; la
 * sorgente di verità è il localStorage (letto on-demand da `isLevel`), e un
 * `_tick` interno notifica i computed quando i livelli cambiano.
 */
export class LocalContext {
  private static readonly _tick = signal<number>(0);

  /** True se il livello "debug" è attivo. Reattivo: si aggiorna a ogni
   *  `toggleLevel`/`clear`. */
  static readonly isDebugMode: Signal<boolean> = computed(() => {
    LocalContext._tick();
    return LocalContext.isLevel('debug');
  });

  static toggleLevel(...ls: string[]): void {
    const levels = getLevels();
    ls.map(l => sanitizeLevel(l)).forEach(sl => {
      if (levels.includes(sl)) {
        _remove(levels, l => l === sl);
      } else {
        levels.push(sl);
      }
    });
    setLevels(levels);
    LocalContext._tick.update(v => v + 1);
  }

  static clear(): void {
    localStorage.removeItem(SUDOKU_DEBUG_LEVELS_KEY);
    LocalContext._tick.update(v => v + 1);
  }

  /**
   * Vero se almeno uno dei livelli `ls` è attivo. Lettura sincrona dal
   * localStorage (non reattiva): per un valore reattivo usare `isDebugMode`
   * o un `computed(() => { LocalContext._tick(); return LocalContext.isLevel(...); })`.
   */
  static isLevel(...ls: string[]): boolean {
    const levels = getLevels();
    return !!(ls || []).find(l => levels.includes(sanitizeLevel(l)));
  }
}
