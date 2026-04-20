import { Type } from '@angular/core';

/**
 * Registry lazy delle pagine di descrizione degli algoritmi.
 * Ogni voce → funzione che restituisce una Promise del componente standalone
 * che descrive l'algoritmo. Il caricamento avviene solo quando l'utente
 * apre effettivamente il dialog per quell'id.
 *
 * NOTA: le `id` corrispondono a quelle registrate nel catalogo `@olmi/algorithms`
 * (vedi `Algorithm.id` di ogni classe).
 */
export const ALGORITHM_INFO_PAGES: Record<string, () => Promise<Type<unknown>>> = {
  'XWings': () =>
    import('./catalog/x-wings/x-wings-info.component')
      .then(m => m.XWingsInfoComponent),
};

export const hasAlgorithmInfoPage = (id: string): boolean =>
  !!ALGORITHM_INFO_PAGES[id];

export const loadAlgorithmInfoPage = (id: string): Promise<Type<unknown>> | undefined =>
  ALGORITHM_INFO_PAGES[id]?.();
