# Algorithms (v3.0)

Catalogo completo e dettagli in [documents/alghoritms.md](../../documents/alghoritms.md).

Registro in [src/lib/algorithms.common.ts](src/lib/algorithms.common.ts). Helper parametrici per subset/fish in [src/lib/algorithms.subset.helper.ts](src/lib/algorithms.subset.helper.ts).

<br>

### Solver (valorizzano celle)

- **One Cell For Value** — `priority 0` — hidden single
- **One Value For Cell** — `priority 1` — naked single
- **Try Number** — `priority 100` — brute-force (MRV + Degree)

### Support — naked subsets

- **Naked Pair (Twins)** — `priority 2`
- **Naked Triple** — `priority 5`
- **Naked Quad** — `priority 7`

### Support — hidden subsets

- **Hidden Pair** — `priority 3`
- **Hidden Triple** — `priority 6`
- **Hidden Quad** — `priority 8`

### Support — intersection / couples

- **Alignment On Group** — `priority 4` — pointing / claiming
- **Couples** — `priority 10`

### Support — fish

- **X-Wings** — `priority 9`
- **Swordfish** — `priority 12`
- **Jellyfish** — `priority 15`

### Support — wings / uniqueness / colouring / chains

- **XY-Wings** — `priority 11` (include i casi prima gestiti da YWings, rimosso in v3.0)
- **Unique Rectangle** — `priority 13` — tipo 1 + tipo 2
- **Simple Colouring** — `priority 14` — color trap + color wrap
- **Turbot Fish** — `priority 16` — ex `Chains` (rinominato in v3.0)

### Support — endgame

- **BUG** — `priority 20`

<br>

### Rimossi in v3.0

- `YWings` → sottoinsieme di `XYWings`
- `Chains` → rinominato in `TurbotFish`

Il bump di `algorithmsVersion` in `package.json` fa sì che l'API ricalcoli automaticamente tutto il catalogo all'avvio.
