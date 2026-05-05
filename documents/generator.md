# Generator

Il generator produce nuovi schemi Sudoku in base a vincoli specificati dall'utente (numero di celle fisse, simmetria, intervallo di difficoltà, algoritmi consentiti…). Il lavoro è eseguito in **processi worker paralleli** e i risultati confluiscono in un'area condivisa.

Implementazione core: [libs/logic/src/lib/logic.generator.ts](../libs/logic/src/lib/logic.generator.ts), [logic.generator.helper.ts](../libs/logic/src/lib/logic.generator.helper.ts).

Frontend:
- Pagina: [apps/sudoku/src/app/pages/generator](../apps/sudoku/src/app/pages/generator)
- Form opzioni: [libs/components/generator-options](../libs/components/generator-options)
- Preview risultati: [libs/components/generator-schemas](../libs/components/generator-schemas)

---

## Opzioni di generazione

Tipo [`GeneratorOptions`](../libs/model/src/lib/generator.ts) (estende `SolveOptions`).

| Opzione | Tipo | Default | Descrizione |
|---------|------|---------|-------------|
| `fixedCount` | number | `GENERATOR_DEFAULT_NUMBERS` | Numero di celle **fisse** desiderate nello schema finale (tipicamente 17–40) |
| `symmetry` | `Symmetry` | `central` | Simmetria delle celle fisse: `central`, `axial`, `diagonal`, `none` |
| `maxOrbits` | number | `1` | Numero di **orbite** (famiglie di equivalenza) da generare in sessione. Ogni orbita emette `1 + (variantsCount-1)` schemi. |
| `variantsCount` | number | `1` | Numero di varianti equivalenti da emettere per ogni orbita (vedi sezione *Varianti*) |
| `maxSeconds` | number | `0` (∞) | Timeout per la generazione |
| `endMode` | `EndGenerationMode` | `afterN` | Condizione di arresto della sessione |
| `valuesMode` | `ValorizationMode` | `auto` | Modalità di valorizzazione delle celle dinamiche (`auto`, `sequential`, `random`) |
| `difficultyLimitMin` | string | `''` | Espressione minima di difficoltà accettata |
| `difficultyLimitMax` | string | `''` | Espressione massima di difficoltà accettata |
| `allowTryAlgorithm` | boolean | `false` | Se `true` accetta schemi risolvibili solo con `TryNumber` (brute-force) |
| `oneForSchema` | boolean | `true` | Richiede **soluzione unica** |
| `useAlgorithms` | string[] | `[]` | Whitelist degli algoritmi usabili dal solver (vuoto = tutti) |
| `workersLength` | number | `2` | Numero di worker paralleli (1–10) |

---

## Flusso di generazione

Orchestrato da [`LogicManager`](../libs/components/common/src/lib/logic.manager.ts) che istanzia N [`LogicWorker`](../libs/components/common/src/lib/logic.worker.ts). Ogni worker esegue un ciclo sull'engine [`logic.generator.ts`](../libs/logic/src/lib/logic.generator.ts):

1. **Schema base riempito**: `generateNewSchema()` costruisce uno schema risolto (tutte le 81 celle valorizzate) rispettando le regole del Sudoku.
2. **Completamento**: `completeSchema()` aggiunge **celle dinamiche** partendo da un template iniziale; la simmetria scelta determina se ad ogni cella aggiunta corrisponda una controparte speculare.
3. **Valorizzazione**: `fillCurrentSchema()` dà un valore alle celle dinamiche secondo `valuesMode`:
   - `auto` → valore derivato dallo schema base;
   - `sequential` → seguono l'ordine naturale;
   - `random` → pescaggio casuale (`shuffleCells()`).
4. **Verifica**: il solver tenta di risolvere lo schema candidato.
   - Con `oneForSchema = true` la soluzione dev'essere unica (altrimenti si aggiunge una cella fissa e si riprova).
   - La sequenza degli algoritmi usati determina la difficoltà: se fuori `[difficultyLimitMin, difficultyLimitMax]` lo schema viene scartato o ritentato.
5. **Gate finale**: se `fixedCount` è raggiunto e la difficoltà è in range, lo schema è emesso in `GenerationStat.generatedSchema` e accumulato nel catalogo della sessione.
6. **Loop**: il worker ripete fino a `maxOrbits` (in modalità `afterN`) o `maxSeconds` (in modalità `afterTime`) o `STOP` manuale.

Stato della sessione: `GenerationSession` ([logic.model.ts](../libs/logic/src/lib/logic.model.ts)) — contiene opzioni, celle correnti, cache, contatori.

---

## Simmetrie

Definite da [`Symmetry`](../libs/model/src/lib/consts.ts):

| Simmetria | Descrizione |
|-----------|-------------|
| `central` | Rotazione 180°: ogni cella fissa in `(r,c)` ha gemella in `(8-r, 8-c)` |
| `axial` | Riflessione su asse (orizzontale o verticale) |
| `diagonal` | Riflessione sulla diagonale |
| `none` | Nessun vincolo di simmetria |

La simmetria è applicata durante `completeSchema()` quando si aggiungono celle dinamiche.

---

## Multi-worker

- Ogni worker è un'istanza Web Worker che carica l'engine solver/generator.
- `LogicManager` mantiene la pool, distribuisce i job e aggrega i risultati nell'area comune UI.
- Ciascun worker lavora su sessioni indipendenti e emette eventi di avanzamento (`GenerationStat`): schema generato, corrente, contatore schemi gestiti.
- La UI ([`generator.component.ts`](../apps/sudoku/src/app/pages/generator/generator.component.ts)) si iscrive agli eventi e aggiorna le preview via [`generator-schemas.component`](../libs/components/generator-schemas).

---

## Calcolo della difficoltà

Implementato in [logic.difficulty.ts](../libs/logic/src/lib/logic.difficulty.ts).

Il valore di difficoltà (`Difficulty.difficultyValue`) è la **somma** dei contributi di ogni algoritmo applicato nella sequenza di risoluzione. Il contributo si ottiene valutando l'espressione `factor` dell'algoritmo in uno scope con queste variabili (vedi [difficulty.md](../libs/logic/src/lib/difficulty.md)):

| Variabile | Significato |
|-----------|-------------|
| `N` | Numero di valori già inseriti (posizione nel ciclo di risoluzione) |
| `NU` | Numeri totali necessari al riempimento |
| `NE` | `NU - N` — numeri mancanti al riempimento |
| `NEP` | `(NU - N) / NU` — percentuale di numeri mancanti |
| `NP` | `N / NU` — percentuale di numeri inseriti |

Esempi:
- `OneCellForValue`: `+10` — contributo costante, tecnica base.
- `OneValueForCell`: `+25+(NEP*15)` — più si è all'inizio più "pesa".
- `TryNumber`: `+400+(4*NU*NEP)` — penalità alta per brute-force.

Funzioni di supporto:
- `_calcIncrement(factor, scope)` — parser/valutatore dell'espressione.
- `_getAlgApplicationId(alg, result)` — dedup di pattern ripetuti.
- `_calcDifficultyValue(results)` — aggrega i contributi in `difficultyValue` e popola `difficultyMap` (mappa `algorithmId → conteggio`).

Il livello testuale (`Difficulty.difficulty`: es. `easy`, `medium`, `hard`…) deriva da soglie definite in [logic.catalog.ts](../libs/logic/src/lib/logic.catalog.ts) applicate a `difficultyValue`.

---

## Livelli di difficoltà

`Difficulty` ([libs/model/src/lib/difficulty.ts](../libs/model/src/lib/difficulty.ts)) espone:

- `difficulty` — etichetta testuale;
- `difficultyValue` — punteggio numerico aggregato;
- `difficultyMap` — mappa algoritmo → numero di utilizzi;
- `algorithmCount` — distinti algoritmi applicati;
- `useTryAlgorithm` / `tryAlgorithmCount` — indicatori di ricorso al brute-force.

Le soglie numeriche per le etichette sono in [libs/model/src/levels.ts](../libs/model/src/levels.ts) / [logic.catalog.ts](../libs/logic/src/lib/logic.catalog.ts).

---

## Integrazione con il catalogo

Gli schemi generati possono essere **salvati nel catalogo** tramite l'API (`POST /sudoku/upload` o conservazione lato client). Il componente [`schema-keeper`](../libs/components/schema-keeper) gestisce la persistenza dal player/generator verso lo storage MongoDB.
