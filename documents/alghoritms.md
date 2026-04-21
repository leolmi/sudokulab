# Algoritmi di risoluzione

Gli algoritmi di risoluzione sono il cuore di SudokuLab: ciascuno rappresenta una **tecnica di logica Sudoku** implementata come classe che estende [`Algorithm`](../libs/model/src/lib/algorithm.ts). Vengono applicati in sequenza dal solver fino a completare lo schema (o fino a dover ricorrere al brute-force).

Il catalogo vive in [libs/algorithms/src/lib/catalog](../libs/algorithms/src/lib/catalog) e ogni algoritmo si registra nel registro globale `ALGORITHMS[]` definito in [algorithms.common.ts](../libs/algorithms/src/lib/algorithms.common.ts).

Versione corrente del catalogo: **`algorithmsVersion = 3.0`** (vedi `package.json`). Al bump di questa versione l'API ricalcola automaticamente tutti gli schemi del catalogo all'avvio (vedi [sudoku.service.ts](../apps/api/src/app/sudoku/sudoku.service.ts)).

---

## Contratto di un algoritmo

```ts
abstract class Algorithm {
  id: string;                 // identificatore univoco (es. "XWings")
  name: string;               // nome visualizzato
  priority: number;           // ordine di applicazione (0 = prima)
  icon: string;               // icona Material
  type: AlgorithmType;        // 'solver' | 'support'
  factor: string;             // espressione di contributo alla difficoltà
  title: string;
  description: string;
  options: AlgorithmOptions;
  apply(cells: SudokuCell[]): AlgorithmResult;
}
```

- **`type = 'solver'`** → l'algoritmo **valorizza** una cella (risolve).
- **`type = 'support'`** → l'algoritmo **riduce i candidati** (`available`); prepara il terreno per un solver.
- **`factor`** → espressione valutata in [logic.difficulty.ts](../libs/logic/src/lib/logic.difficulty.ts) usando le variabili `N`, `NU`, `NE`, `NEP`, `NP`.
- **`AlgorithmResult`** contiene: snapshot celle, righe descrittive, casi (per brute-force), celle toccate, highlights e stato `applied`.

La funzione comune [`applyAlgorithm`](../libs/algorithms/src/lib/algorithms.common.ts) incapsula il pattern di esecuzione standard.

---

## Variabili di difficoltà dinamica

La formula `factor` di ogni algoritmo viene valutata in uno scope con 5 variabili (documentate in [difficulty.md](../libs/logic/src/lib/difficulty.md)):

| Variabile | Significato |
|-----------|-------------|
| `N` | Numero di valori già inseriti (posizione nel ciclo) |
| `NU` | Numeri totali necessari al riempimento |
| `NE` | `NU - N` — numeri ancora mancanti |
| `NEP` | `(NU - N) / NU` — **percentuale mancanti** (1 all'inizio → 0 alla fine) |
| `NP` | `N / NU` — **percentuale inseriti** (0 all'inizio → 1 alla fine) |

### Regola pratica per i factor

- Tecniche che **lavorano sui candidati** (naked/hidden subsets, fish, wings, chains…) sono **più difficili all'inizio** (tanti candidati, pattern diluiti) → peso con **`NEP`**.
- Tecniche che si **applicano solo con schema quasi pieno** (es. `BUG`) → peso con **`NP`**.
- Tecniche **costanti** (es. `OneCellForValue`) → nessun peso dinamico.

---

## Catalogo degli algoritmi (v3.0)

Ordine per priorità crescente (= ordine di tentativo del solver).

### 1. One Cell For Value — `priority 0`
File: [OneCellForValue.algorithm.ts](../libs/algorithms/src/lib/catalog/OneCellForValue.algorithm.ts)
- **id**: `OneCellForValue` · **type**: `solver` · **factor**: `+10`
- In un gruppo **una sola cella** può contenere un certo valore (hidden single).

### 2. One Value For Cell — `priority 1`
File: [OneValueForCell.algorithm.ts](../libs/algorithms/src/lib/catalog/OneValueForCell.algorithm.ts)
- **id**: `OneValueForCell` · **type**: `solver` · **factor**: `+20+(NEP*15)`
- Una cella ha **un solo candidato** residuo (naked single).

### 3. Naked Pair (Twins) — `priority 2`
File: [Twins.algorithm.ts](../libs/algorithms/src/lib/catalog/Twins.algorithm.ts)
- **id**: `Twins` · **type**: `support` · **factor**: `+25+(NEP*15)`
- Due celle dello stesso gruppo condividono esattamente 2 candidati → escludi quei valori dalle altre celle del gruppo. Il finder copre anche il caso "hidden pair" (due valori confinati in due celle): per questo non esiste un algoritmo `HiddenPair` separato — la logica è già inclusa qui.

### 4. Alignment On Group — `priority 3`
File: [AlignmentOnGroup.algorithm.ts](../libs/algorithms/src/lib/catalog/AlignmentOnGroup.algorithm.ts)
- **id**: `AlignmentOnGroup` · **type**: `support` · **factor**: `+20+(NEP*12)`
- Pointing pair (box → riga/colonna) e claiming (riga/colonna → box).

### 5. Naked Triple — `priority 4` *(nuovo)*
File: [NakedTriple.algorithm.ts](../libs/algorithms/src/lib/catalog/NakedTriple.algorithm.ts)
- **id**: `NakedTriple` · **type**: `support` · **factor**: `+50+(NEP*30)`
- Tre celle la cui **unione** dei candidati vale esattamente 3 valori.

### 6. Hidden Triple — `priority 5` *(nuovo)*
File: [HiddenTriple.algorithm.ts](../libs/algorithms/src/lib/catalog/HiddenTriple.algorithm.ts)
- **id**: `HiddenTriple` · **type**: `support` · **factor**: `+80+(NEP*45)`
- Tre valori confinati in 3 sole celle di un gruppo.

### 7. Naked Quad — `priority 6` *(nuovo)*
File: [NakedQuad.algorithm.ts](../libs/algorithms/src/lib/catalog/NakedQuad.algorithm.ts)
- **id**: `NakedQuad` · **type**: `support` · **factor**: `+100+(NEP*60)`

### 8. Hidden Quad — `priority 7` *(nuovo)*
File: [HiddenQuad.algorithm.ts](../libs/algorithms/src/lib/catalog/HiddenQuad.algorithm.ts)
- **id**: `HiddenQuad` · **type**: `support` · **factor**: `+130+(NEP*65)`

### 9. X-Wings — `priority 8`
File: [XWings.algorithm.ts](../libs/algorithms/src/lib/catalog/XWings.algorithm.ts)
- **id**: `XWings` · **type**: `support` · **factor**: `+140+(NEP*50)`
- Un valore V ha esattamente 2 posizioni su 2 righe, confinate nelle stesse 2 colonne (o viceversa) → V escluso dalle altre celle di quelle colonne.

### 10. Couples — `priority 9`
File: [Couples.algorithm.ts](../libs/algorithms/src/lib/catalog/Couples.algorithm.ts)
- **id**: `Couples` · **type**: `support` · **factor**: `+80+(NEP*40)`
- Coppie di valori che producono allineamenti incrociati.

### 11. XY-Wings — `priority 10`
File: [XYWings.algorithm.ts](../libs/algorithms/src/lib/catalog/XYWings.algorithm.ts)
- **id**: `XYWings` · **type**: `support` · **factor**: `+180+(NEP*60)`
- Pivot `[A,B]` + wings `[A,X]`, `[B,X]` → escludi X dalle celle che vedono entrambe le wings. Include anche il caso precedentemente chiamato "Y-Wings" (rimosso perché sottoinsieme).

### 12. Swordfish — `priority 11` *(implementato)*
File: [Swordfish.algorithm.ts](../libs/algorithms/src/lib/catalog/Swordfish.algorithm.ts)
- **id**: `Swordfish` · **type**: `support` · **factor**: `+240+(NEP*100)`
- Generalizzazione di X-Wings a 3 righe/colonne.

### 13. Unique Rectangle — `priority 12` *(nuovo)*
File: [UniqueRectangle.algorithm.ts](../libs/algorithms/src/lib/catalog/UniqueRectangle.algorithm.ts)
- **id**: `UniqueRectangle` · **type**: `support` · **factor**: `+160+(NEP*40)`
- Tipo 1 e tipo 2: sfrutta il vincolo di soluzione unica (deadly pattern).

### 14. Simple Colouring — `priority 13` *(nuovo)*
File: [SimpleColouring.algorithm.ts](../libs/algorithms/src/lib/catalog/SimpleColouring.algorithm.ts)
- **id**: `SimpleColouring` · **type**: `support` · **factor**: `+280+(NEP*100)`
- Catene di coppie coniugate per un singolo valore + eliminazioni Color Trap / Color Wrap.

### 15. Jellyfish — `priority 14` *(nuovo)*
File: [Jellyfish.algorithm.ts](../libs/algorithms/src/lib/catalog/Jellyfish.algorithm.ts)
- **id**: `Jellyfish` · **type**: `support` · **factor**: `+360+(NEP*160)`
- Fish di taglia 4 (4 righe/colonne).

### 16. Turbot Fish — `priority 15` *(ex Chains)*
File: [TurbotFish.algorithm.ts](../libs/algorithms/src/lib/catalog/TurbotFish.algorithm.ts)
- **id**: `TurbotFish` · **type**: `support` · **factor**: `+200+(NEP*80)`
- Struttura a 3 gruppi con raccordo. Include casi Skyscraper, Two-String Kite, Empty Rectangle.
- Rinominato da `Chains` in v3.0 (il vecchio id non è più riconosciuto).

### 17. BUG — `priority 16`
File: [Bug.algorithm.ts](../libs/algorithms/src/lib/catalog/Bug.algorithm.ts)
- **id**: `Bug` · **type**: `support` · **factor**: `+80+(NP*40)`
- Tecnica endgame (BUG+1). Peso dinamico via `NP` (schema pieno).

### 18. Try Number — `priority 100`
File: [TryNumber.algorithm.ts](../libs/algorithms/src/lib/catalog/TryNumber.algorithm.ts)
- **id**: `TryNumber` · **type**: `solver` · **factor**: `+400+(4*NU*NEP)`
- Brute force con euristica **MRV + Degree** (v3.0): a parità di candidati, preferisce la cella che vede più celle vuote.

---

## Algoritmi rimossi in v3.0

| Vecchio id | Motivo | Sostituito da |
|-----------|--------|---------------|
| `YWings` | Sotto-insieme di `XYWings` (partiva solo da coppie in righe/colonne, mai da box) | `XYWings` |
| `Chains` | Nome fuorviante: implementava un pattern Turbot Fish a 3 gruppi | `TurbotFish` |

Il ricalcolo automatico degli schemi in catalogo ([sudoku.service.ts](../apps/api/src/app/sudoku/sudoku.service.ts) → `checkAll()`) rimuove i vecchi id dalle `difficultyMap` dopo il bump di `algorithmsVersion`.

---

## Helper condivisi

Oltre a [algorithms.common.ts](../libs/algorithms/src/lib/algorithms.common.ts) (registro + `applyAlgorithm` + `onCouples` + `onOthers` + `onCellGroups` + `getHighlights` + `getSingleResultLine`), le tecniche parametriche usano:

- [algorithms.subset.helper.ts](../libs/algorithms/src/lib/algorithms.subset.helper.ts):
  - `applyNakedSubset(alg, cells, res, N)` → core di Naked Pair/Triple/Quad.
  - `applyHiddenSubset(alg, cells, res, N)` → core di Hidden Triple (N=3) / Hidden Quad (N=4). Il caso N=2 non ha un algoritmo dedicato perché `Twins` cattura già lo stesso pattern a priority più bassa.
  - `applyFish(alg, cells, res, N, baseType)` → core di Swordfish (N=3) e Jellyfish (N=4); applicabile anche a X-Wings (N=2) volendo consolidarlo.

Utility di supporto:
- `findFirstAppliedAlgorithm(cells, opts)` → itera il registro in ordine di priority e restituisce il primo algoritmo applicato (rispetta `skipAlgorithm`).
- `getAlgorithm(id)` / `getAlgorithms()` — lookup nel registro.

---

## Come il solver usa gli algoritmi

Il solver ([logic.solver.ts](../libs/logic/src/lib/logic.solver.ts)):

1. Inizializza il contesto con `initSolver`.
2. Cicla `solveStep()`: chiama `findFirstAppliedAlgorithm` e applica il primo che produce un cambiamento.
3. Se `solver` → cella valorizzata; se `support` → solo riduzione candidati.
4. Se emerge `TryNumber` → schema biforcato in più soluzioni (`cases`), processate in parallelo con `solveParallelStep`.
5. Modalità: `all`, `one-step`, `to-step`, `to-try`.
6. La sequenza degli `AlgorithmResult` alimenta il calcolo della difficoltà.

---

## Aggiungere un nuovo algoritmo

1. Creare `MyAlgo.algorithm.ts` in [libs/algorithms/src/lib/catalog](../libs/algorithms/src/lib/catalog) che estende `Algorithm`.
2. Implementare `apply()` con `applyAlgorithm()` + helper di `algorithms.common.ts` (o `algorithms.subset.helper.ts` se pattern parametrico).
3. Chiamare `registerAlgorithm(new MyAlgorithm())`.
4. Scegliere `priority` in base al posto nella scala di difficoltà tra gli esistenti (lasciare gap per inserimenti futuri).
5. Definire `factor` seguendo la regola pratica sopra.
6. Aggiungere l'export in `catalog/index.ts` preservando l'ordine.
7. **Bumpare `algorithmsVersion`** in `package.json` per forzare il ricalcolo del catalogo esistente.
