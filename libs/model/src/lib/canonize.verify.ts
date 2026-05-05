/**
 * Script di verifica della robustezza di `canonize` / `applyToken`.
 *
 * Esecuzione:
 *   npx tsx libs/model/src/lib/canonize.verify.ts
 *
 * Test eseguiti (per ognuno: 0 errori = ok):
 * 1. Round-trip: applyToken(canonize(S).canonical, canonize(S).token) === S
 * 2. Idempotenza: canonize(canonical) ha canonical invariata
 * 3. Equivalenza D4: tutti gli 8 ruotati/flippati di S hanno la stessa `canonical`
 * 4. Equivalenza relabeling: schemi con cifre permutate hanno la stessa `canonical`
 * 5. Equivalenza completa: 8 × 100 permutazioni casuali → tutti stesso `canonical`
 * 6. Distinzione: schemi non equivalenti hanno `canonical` diverse
 */

import { canonize, applyToken, CanonizeToken } from './canonize';

const RANK = 9;
const TOTAL = 81;

// ===== Schemi di test =====
// Tre schemi unique-solution noti, scelti per coprire diverse strutture.
const TEST_SCHEMAS: { name: string; values: string }[] = [
  {
    name: 'easy-1',
    values: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
  },
  {
    name: 'medium-1',
    values: '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
  },
  {
    name: 'hard-1',
    values: '800000000003600000070090200050007000000045700000100030001000068008500010090000400',
  },
];

// ===== Trasformazioni di riferimento (indipendenti da canonize.ts) =====

const transformD4Reference = (values: string, t: number): string => {
  const out: string[] = new Array(TOTAL);
  for (let r = 0; r < RANK; r++) {
    for (let c = 0; c < RANK; c++) {
      let r2: number, c2: number;
      switch (t) {
        case 0: [r2, c2] = [r, c]; break;
        case 1: [r2, c2] = [c, RANK - 1 - r]; break;
        case 2: [r2, c2] = [RANK - 1 - r, RANK - 1 - c]; break;
        case 3: [r2, c2] = [RANK - 1 - c, r]; break;
        case 4: [r2, c2] = [r, RANK - 1 - c]; break;
        case 5: [r2, c2] = [c, r]; break;
        case 6: [r2, c2] = [RANK - 1 - r, c]; break;
        case 7: [r2, c2] = [RANK - 1 - c, RANK - 1 - r]; break;
        default: throw new Error(`bad t ${t}`);
      }
      out[r2 * RANK + c2] = values.charAt(r * RANK + c);
    }
  }
  return out.join('');
};

const applyDigitPermutation = (values: string, perm: number[]): string => {
  // perm[d-1] = nuova cifra per la cifra originale d (1..9)
  let out = '';
  for (let i = 0; i < TOTAL; i++) {
    const ch = values.charAt(i);
    if (ch >= '1' && ch <= '9') {
      out += String(perm[parseInt(ch, 10) - 1]);
    } else {
      out += '0';
    }
  }
  return out;
};

const randomPerm9 = (): number[] => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ===== Reporter =====

let totalChecks = 0;
let totalErrors = 0;
const errors: string[] = [];

const check = (cond: boolean, message: string): void => {
  totalChecks++;
  if (!cond) {
    totalErrors++;
    errors.push(message);
  }
};

const summarize = (label: string): void => {
  console.log(`  ${label}: checks=${totalChecks} errors=${totalErrors}`);
};

// ===== Test 1: round-trip =====
console.log('\n[1] Round-trip applyToken(canonize(S)) === S');
for (const s of TEST_SCHEMAS) {
  const { canonical, token } = canonize(s.values);
  const reconstructed = applyToken(canonical, token);
  check(
    reconstructed === s.values,
    `${s.name}: round-trip failed\n  expected: ${s.values}\n  got:      ${reconstructed}`
  );
}
summarize('Test 1');

// ===== Test 2: idempotenza =====
console.log('\n[2] Idempotenza: canonize(canonical).canonical === canonical');
for (const s of TEST_SCHEMAS) {
  const { canonical } = canonize(s.values);
  const { canonical: canonical2 } = canonize(canonical);
  check(canonical === canonical2, `${s.name}: canonical non idempotente`);
}
summarize('Test 2');

// ===== Test 3: equivalenza D4 =====
console.log('\n[3] Tutti i D4(S) hanno la stessa canonical');
for (const s of TEST_SCHEMAS) {
  const { canonical: c0 } = canonize(s.values);
  for (let t = 1; t < 8; t++) {
    const transformed = transformD4Reference(s.values, t);
    const { canonical: ct } = canonize(transformed);
    check(ct === c0, `${s.name}: D4(t=${t}) → canonical diversa`);
  }
}
summarize('Test 3');

// ===== Test 4: equivalenza relabeling =====
console.log('\n[4] Tutte le permutazioni di cifre danno stessa canonical');
for (const s of TEST_SCHEMAS) {
  const { canonical: c0 } = canonize(s.values);
  for (let i = 0; i < 50; i++) {
    const perm = randomPerm9();
    const permuted = applyDigitPermutation(s.values, perm);
    const { canonical: cp } = canonize(permuted);
    check(cp === c0, `${s.name}: perm ${perm.join('')} → canonical diversa`);
  }
}
summarize('Test 4');

// ===== Test 5: equivalenza combinata D4 × relabeling =====
console.log('\n[5] Tutte le combinazioni D4 × perm danno stessa canonical, e applyToken ricostruisce');
for (const s of TEST_SCHEMAS) {
  const { canonical: c0 } = canonize(s.values);
  for (let t = 0; t < 8; t++) {
    for (let i = 0; i < 10; i++) {
      const perm = randomPerm9();
      const transformed = applyDigitPermutation(transformD4Reference(s.values, t), perm);
      const { canonical: ct, token } = canonize(transformed);
      check(ct === c0, `${s.name}: D4(${t}) + perm → canonical diversa`);
      const reconstructed = applyToken(ct, token);
      check(
        reconstructed === transformed,
        `${s.name}: D4(${t}) + perm → applyToken non ricostruisce`
      );
    }
  }
}
summarize('Test 5');

// ===== Test 6: distinzione di schemi non equivalenti =====
console.log('\n[6] Schemi non equivalenti hanno canonical diverse');
const cs = TEST_SCHEMAS.map((s) => canonize(s.values).canonical);
for (let i = 0; i < cs.length; i++) {
  for (let j = i + 1; j < cs.length; j++) {
    check(
      cs[i] !== cs[j],
      `${TEST_SCHEMAS[i].name} e ${TEST_SCHEMAS[j].name} producono la stessa canonical (collisione anomala)`
    );
  }
}
summarize('Test 6');

// ===== Esito finale =====
console.log('\n' + '='.repeat(60));
if (totalErrors === 0) {
  console.log(`OK — ${totalChecks} verifiche passate, 0 errori`);
} else {
  console.log(`FAIL — ${totalErrors}/${totalChecks} verifiche fallite`);
  console.log('\nDettaglio errori:');
  errors.slice(0, 10).forEach((e) => console.log(`  - ${e}`));
  if (errors.length > 10) console.log(`  ... e altri ${errors.length - 10}`);
  throw new Error(`canonize verification failed: ${totalErrors} errors`);
}
