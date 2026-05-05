/**
 * Forma canonica di uno schema sudoku sotto il gruppo di equivalenza
 * **D4 + relabeling delle cifre** (8 × 9! = ~2,9M trasformazioni per orbita).
 *
 * Schemi equivalenti sotto rotazione/flip e/o permutazione di cifre collassano
 * sulla stessa stringa canonica. Il `token` permette di ricostruire lo schema
 * originale a partire dal canonico tramite `applyToken`.
 *
 * Uso tipico:
 *   const { canonical, token } = canonize(schemaValues);
 *   // ... persisti `canonical` come ID di equivalenza ...
 *   const original = applyToken(canonical, token);  // ricostruzione
 *
 * Modulo puro: nessuna dipendenza da `@olmi/model` (per essere indipendente
 * da rank fisso/altri tipi e poter essere testato in isolamento).
 */

const RANK = 9;
const TOTAL = 81;

/**
 * Permutazione di indici 0..80 che descrive una trasformazione geometrica:
 * `result.charAt(i) = source.charAt(perm[i])`.
 */
type Permutation = number[];

/**
 * Costruisce la permutazione associata a una mappa (r,c) → (r',c') sulla griglia 9×9.
 */
const buildPerm = (mapper: (r: number, c: number) => [number, number]): Permutation => {
  const p = new Array<number>(TOTAL);
  for (let r = 0; r < RANK; r++) {
    for (let c = 0; c < RANK; c++) {
      const [r2, c2] = mapper(r, c);
      p[r2 * RANK + c2] = r * RANK + c;
    }
  }
  return p;
};

/**
 * Le 8 trasformazioni del gruppo diedrale D4 sulla griglia 9×9:
 * 0 = e (identità)
 * 1 = r   (rotazione 90° in senso orario)
 * 2 = r²  (rotazione 180°)
 * 3 = r³  (rotazione 270°)
 * 4 = f   (flip verticale, riflessione sinistra-destra)
 * 5 = rf  (trasposizione, flip diagonale NW-SE)
 * 6 = r²f (flip orizzontale, riflessione sopra-sotto)
 * 7 = r³f (flip antidiagonale NE-SW)
 */
const D4_PERMS: Permutation[] = [
  buildPerm((r, c) => [r, c]),
  buildPerm((r, c) => [c, RANK - 1 - r]),
  buildPerm((r, c) => [RANK - 1 - r, RANK - 1 - c]),
  buildPerm((r, c) => [RANK - 1 - c, r]),
  buildPerm((r, c) => [r, RANK - 1 - c]),
  buildPerm((r, c) => [c, r]),
  buildPerm((r, c) => [RANK - 1 - r, c]),
  buildPerm((r, c) => [RANK - 1 - c, RANK - 1 - r]),
];

/**
 * Inverso di ogni elemento di D4 (stesso ordinamento dell'array sopra):
 * - rotazioni: r ↔ r³, r² è autoinverso
 * - flip: tutti autoinversi (involuzioni)
 */
const D4_INVERSE: number[] = [0, 3, 2, 1, 4, 5, 6, 7];

/**
 * Applica una trasformazione D4 alla stringa-schema 81 caratteri.
 */
const applyD4 = (values: string, t: number): string => {
  const perm = D4_PERMS[t];
  let out = '';
  for (let i = 0; i < TOTAL; i++) out += values.charAt(perm[i]);
  return out;
};

/**
 * Rinomina le cifre in ordine di prima apparizione (row-major):
 * la prima cifra non-zero che compare diventa "1", la seconda distinta diventa "2", ecc.
 * Le celle vuote ('0' o caratteri non-cifra) restano '0'.
 *
 * Restituisce la stringa rinumerata + la mappa inversa (9 caratteri) che permette
 * di tornare alle cifre originali: `inverseMap.charAt(c-1)` è la cifra originale che è
 * diventata canonica `c`. Per cifre canoniche non usate il carattere è '0'.
 */
const relabelDigits = (values: string): { values: string; inverseMap: string } => {
  const map: Record<string, string> = {};
  let next = 1;
  let out = '';
  for (let i = 0; i < TOTAL; i++) {
    const ch = values.charAt(i);
    if (ch >= '1' && ch <= '9') {
      if (!map[ch]) {
        map[ch] = String(next);
        next++;
      }
      out += map[ch];
    } else {
      out += '0';
    }
  }
  const inverseArr = ['0', '0', '0', '0', '0', '0', '0', '0', '0'];
  for (const sourceDigit of Object.keys(map)) {
    const canonicalDigit = map[sourceDigit];
    inverseArr[parseInt(canonicalDigit, 10) - 1] = sourceDigit;
  }
  return { values: out, inverseMap: inverseArr.join('') };
};

/**
 * Token di trasformazione associato a un canonico:
 * - `t`: indice 0..7 dell'elemento di D4 applicato all'originale per ottenere la
 *   griglia che, dopo `relabel`, produce il canonico
 * - `relabel`: stringa di 9 caratteri, mappa inversa delle cifre (vedi `relabelDigits`)
 */
export interface CanonizeToken {
  t: number;
  relabel: string;
}

/**
 * Esito della canonizzazione: `canonical` è la stringa-schema lex-minima
 * sotto D4 + relabeling, `token` permette il round-trip via `applyToken`.
 */
export interface CanonizeResult {
  canonical: string;
  token: CanonizeToken;
}

/**
 * Calcola la forma canonica dello schema sotto D4 + relabeling delle cifre.
 * Schemi equivalenti collassano sulla stessa `canonical`. Costo: 8 trasformazioni
 * × O(81) ≈ 650 op, indipendente dal contenuto dello schema.
 *
 * @param values stringa-schema di 81 caratteri ('1'..'9' per i fissi, '0' per i vuoti)
 */
export const canonize = (values: string): CanonizeResult => {
  let bestCanonical = '';
  let bestToken: CanonizeToken | undefined;
  for (let t = 0; t < 8; t++) {
    const transformed = applyD4(values, t);
    const { values: relabeled, inverseMap } = relabelDigits(transformed);
    if (bestToken === undefined || relabeled < bestCanonical) {
      bestCanonical = relabeled;
      bestToken = { t, relabel: inverseMap };
    }
  }
  return { canonical: bestCanonical, token: bestToken! };
};

/**
 * Ricostruisce lo schema originale a partire dal canonico e dal token.
 * Vale l'invariante: `applyToken(canonize(S).canonical, canonize(S).token) === S`.
 *
 * @param canonical stringa-schema canonica restituita da `canonize`
 * @param token token restituito da `canonize`
 */
export const applyToken = (canonical: string, token: CanonizeToken): string => {
  // Step 1: inversione del relabeling
  let unrelabeled = '';
  for (let i = 0; i < TOTAL; i++) {
    const ch = canonical.charAt(i);
    if (ch >= '1' && ch <= '9') {
      unrelabeled += token.relabel.charAt(parseInt(ch, 10) - 1);
    } else {
      unrelabeled += '0';
    }
  }
  // Step 2: inversione della trasformazione D4
  return applyD4(unrelabeled, D4_INVERSE[token.t]);
};
