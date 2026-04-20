/**
 * Solver brute-force indipendente dal catalogo `@olmi/algorithms`.
 *
 * Serve come tester esterno per confermare (o smentire) l'univocità di uno schema:
 * non legge mai `SudokuCell.available`, i candidati legali sono ricostruiti in
 * loco dalle sole regole di riga/colonna/box.
 *
 * DFS con euristica MRV (sceglie la cella con il minor numero di candidati legali).
 * Si ferma appena ha trovato `cap` soluzioni, così l'unicità si può verificare
 * con cap=2 senza esplorare l'intero spazio.
 */

/**
 * Conta le soluzioni valide dello schema passato come stringa di 81 caratteri.
 * I caratteri '1'..'9' sono valori fissi, tutto il resto è trattato come cella vuota.
 * @param values stringa di 81 caratteri
 * @param cap numero massimo di soluzioni da contare prima di interrompere (default 2)
 * @returns numero di soluzioni trovate (0..cap); ritorna 0 anche per input non valido
 */
export const countSolutions = (values: string, cap = 2): number => {
  if (!values || values.length < 81) return 0;
  const board = new Uint8Array(81);
  const rowMask = new Uint16Array(9);
  const colMask = new Uint16Array(9);
  const boxMask = new Uint16Array(9);
  for (let i = 0; i < 81; i++) {
    const ch = values.charCodeAt(i);
    const v = (ch >= 49 && ch <= 57) ? ch - 48 : 0;
    if (v) {
      const r = (i / 9) | 0;
      const c = i % 9;
      const b = ((r / 3) | 0) * 3 + ((c / 3) | 0);
      const bit = 1 << v;
      // schema inconsistente in partenza → zero soluzioni
      if ((rowMask[r] | colMask[c] | boxMask[b]) & bit) return 0;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;
      board[i] = v;
    }
  }
  const state = { count: 0 };
  dfs(board, rowMask, colMask, boxMask, state, cap);
  return state.count;
};

const popcount = (x: number): number => {
  let n = 0;
  while (x) { n += x & 1; x >>>= 1; }
  return n;
};

const dfs = (
  board: Uint8Array,
  rowMask: Uint16Array,
  colMask: Uint16Array,
  boxMask: Uint16Array,
  state: { count: number },
  cap: number
): void => {
  // MRV: cerca la cella vuota con il minor numero di candidati legali
  let best = -1;
  let bestMask = 0;
  let bestPop = 10;
  for (let i = 0; i < 81; i++) {
    if (board[i]) continue;
    const r = (i / 9) | 0;
    const c = i % 9;
    const b = ((r / 3) | 0) * 3 + ((c / 3) | 0);
    // bit 1..9 liberi in tutte e tre le maschere
    const free = 0x3fe & ~(rowMask[r] | colMask[c] | boxMask[b]);
    if (!free) return; // cella vuota senza candidati → ramo morto
    const pop = popcount(free);
    if (pop < bestPop) {
      bestPop = pop;
      bestMask = free;
      best = i;
      if (pop === 1) break;
    }
  }
  if (best === -1) {
    // nessuna cella vuota → soluzione completa
    state.count++;
    return;
  }
  const r = (best / 9) | 0;
  const c = best % 9;
  const b = ((r / 3) | 0) * 3 + ((c / 3) | 0);
  for (let v = 1; v <= 9; v++) {
    const bit = 1 << v;
    if (!(bestMask & bit)) continue;
    board[best] = v;
    rowMask[r] |= bit;
    colMask[c] |= bit;
    boxMask[b] |= bit;
    dfs(board, rowMask, colMask, boxMask, state, cap);
    board[best] = 0;
    rowMask[r] ^= bit;
    colMask[c] ^= bit;
    boxMask[b] ^= bit;
    if (state.count >= cap) return;
  }
};
