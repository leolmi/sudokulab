/**
 * Azioni emesse dal `play-panel` verso il container (player).
 * Il container resta regia centrale: store, BoardManager e routing
 * sono gestiti lì.
 */
export type PlayAction =
  | { kind: 'random' }
  | { kind: 'hard' }
  | { kind: 'with-algorithm'; algorithmId: string };
