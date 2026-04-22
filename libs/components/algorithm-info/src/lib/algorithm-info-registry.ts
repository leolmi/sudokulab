import { Type } from '@angular/core';
import {
  ALIGNMENT_ON_GROUP_ALGORITHM,
  BUG_ALGORITHM,
  COUPLES_ALGORITHM,
  HIDDEN_QUAD_ALGORITHM,
  HIDDEN_TRIPLE_ALGORITHM,
  JELLYFISH_ALGORITHM,
  NAKED_QUAD_ALGORITHM,
  NAKED_TRIPLE_ALGORITHM,
  ONE_CELL_FOR_VALUE_ALGORITHM,
  ONE_VALUE_FOR_CELL_ALGORITHM,
  SIMPLE_COLOURING_ALGORITHM,
  SWORDFISH_ALGORITHM,
  TURBOTFISH_ALGORITHM,
  TWINS_ALGORITHM,
  UNIQUE_RECTANGLE_ALGORITHM,
  XWINGS_ALGORITHM,
  XYWINGS_ALGORITHM,
} from '@olmi/algorithms';
import { TRY_NUMBER_ALGORITHM } from '@olmi/model';

/**
 * Registry lazy delle pagine di descrizione degli algoritmi.
 * Ogni voce → funzione che restituisce una Promise del componente standalone
 * che descrive l'algoritmo. Il caricamento avviene solo quando l'utente
 * apre effettivamente il dialog per quell'id.
 *
 * Le chiavi sono costanti id importate da `@olmi/algorithms`: in questo modo
 * l'identificatore è legato alla sorgente di verità dell'algoritmo stesso
 * (rename-safe, typo-proof).
 */
export const ALGORITHM_INFO_PAGES: Record<string, () => Promise<Type<unknown>>> = {
  [ONE_CELL_FOR_VALUE_ALGORITHM]: () =>
    import('./catalog/one-cell-for-value/one-cell-for-value-info.component')
      .then(m => m.OneCellForValueInfoComponent),
  [ONE_VALUE_FOR_CELL_ALGORITHM]: () =>
    import('./catalog/one-value-for-cell/one-value-for-cell-info.component')
      .then(m => m.OneValueForCellInfoComponent),
  [TWINS_ALGORITHM]: () =>
    import('./catalog/twins/twins-info.component')
      .then(m => m.TwinsInfoComponent),
  [ALIGNMENT_ON_GROUP_ALGORITHM]: () =>
    import('./catalog/alignment-on-group/alignment-on-group-info.component')
      .then(m => m.AlignmentOnGroupInfoComponent),
  [NAKED_TRIPLE_ALGORITHM]: () =>
    import('./catalog/naked-triple/naked-triple-info.component')
      .then(m => m.NakedTripleInfoComponent),
  [HIDDEN_TRIPLE_ALGORITHM]: () =>
    import('./catalog/hidden-triple/hidden-triple-info.component')
      .then(m => m.HiddenTripleInfoComponent),
  [NAKED_QUAD_ALGORITHM]: () =>
    import('./catalog/naked-quad/naked-quad-info.component')
      .then(m => m.NakedQuadInfoComponent),
  [HIDDEN_QUAD_ALGORITHM]: () =>
    import('./catalog/hidden-quad/hidden-quad-info.component')
      .then(m => m.HiddenQuadInfoComponent),
  [XWINGS_ALGORITHM]: () =>
    import('./catalog/x-wings/x-wings-info.component')
      .then(m => m.XWingsInfoComponent),
  [COUPLES_ALGORITHM]: () =>
    import('./catalog/couples/couples-info.component')
      .then(m => m.CouplesInfoComponent),
  [XYWINGS_ALGORITHM]: () =>
    import('./catalog/xy-wings/xy-wings-info.component')
      .then(m => m.XYWingsInfoComponent),
  [SWORDFISH_ALGORITHM]: () =>
    import('./catalog/swordfish/swordfish-info.component')
      .then(m => m.SwordfishInfoComponent),
  [JELLYFISH_ALGORITHM]: () =>
    import('./catalog/jellyfish/jellyfish-info.component')
      .then(m => m.JellyfishInfoComponent),
  [UNIQUE_RECTANGLE_ALGORITHM]: () =>
    import('./catalog/unique-rectangle/unique-rectangle-info.component')
      .then(m => m.UniqueRectangleInfoComponent),
  [SIMPLE_COLOURING_ALGORITHM]: () =>
    import('./catalog/simple-colouring/simple-colouring-info.component')
      .then(m => m.SimpleColouringInfoComponent),
  [TURBOTFISH_ALGORITHM]: () =>
    import('./catalog/turbot-fish/turbot-fish-info.component')
      .then(m => m.TurbotFishInfoComponent),
  [BUG_ALGORITHM]: () =>
    import('./catalog/bug/bug-info.component')
      .then(m => m.BugInfoComponent),
  [TRY_NUMBER_ALGORITHM]: () =>
    import('./catalog/try-number/try-number-info.component')
      .then(m => m.TryNumberInfoComponent),
};

export const hasAlgorithmInfoPage = (id: string): boolean =>
  !!ALGORITHM_INFO_PAGES[id];

export const loadAlgorithmInfoPage = (id: string): Promise<Type<unknown>> | undefined =>
  ALGORITHM_INFO_PAGES[id]?.();
