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
  'OneCellForValue': () =>
    import('./catalog/one-cell-for-value/one-cell-for-value-info.component')
      .then(m => m.OneCellForValueInfoComponent),
  'OneValueForCell': () =>
    import('./catalog/one-value-for-cell/one-value-for-cell-info.component')
      .then(m => m.OneValueForCellInfoComponent),
  'Twins': () =>
    import('./catalog/twins/twins-info.component')
      .then(m => m.TwinsInfoComponent),
  'AlignmentOnGroup': () =>
    import('./catalog/alignment-on-group/alignment-on-group-info.component')
      .then(m => m.AlignmentOnGroupInfoComponent),
  'NakedTriple': () =>
    import('./catalog/naked-triple/naked-triple-info.component')
      .then(m => m.NakedTripleInfoComponent),
  'HiddenTriple': () =>
    import('./catalog/hidden-triple/hidden-triple-info.component')
      .then(m => m.HiddenTripleInfoComponent),
  'XWings': () =>
    import('./catalog/x-wings/x-wings-info.component')
      .then(m => m.XWingsInfoComponent),
};

export const hasAlgorithmInfoPage = (id: string): boolean =>
  !!ALGORITHM_INFO_PAGES[id];

export const loadAlgorithmInfoPage = (id: string): Promise<Type<unknown>> | undefined =>
  ALGORITHM_INFO_PAGES[id]?.();
