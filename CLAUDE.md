# SudokuLab

SudokuLab è un laboratorio Sudoku che consente di **risolvere**, **generare** e **stampare** schemi. L'applicazione espone un frontend Angular (giocatore/generatore/stampa/gestione catalogo) e un backend NestJS con persistenza MongoDB e modulo OCR per acquisire schemi da immagine.

Monorepo Nx: `apps/` (frontend + api), `libs/` (model, algorithms, logic, components, templates).

Prova online: [sudokulab.herokuapp.com](https://sudokulab.herokuapp.com)

---

## Architettura ad alto livello

### Apps

| App | Framework | Path | Ruolo |
|-----|-----------|------|-------|
| `sudoku` | Angular 19 (standalone components) | [apps/sudoku](apps/sudoku) | Client: player, generator, print, management, infos |
| `api` | NestJS 11 + Mongoose | [apps/api](apps/api) | Server: catalogo schemi, validazione, OCR |

### Librerie condivise

| Lib | Path | Contenuto |
|-----|------|-----------|
| `@olmi/model` | [libs/model](libs/model) | Tipi di dominio (Sudoku, SudokuCell, Algorithm, GeneratorOptions, Difficulty, PrintTemplate, Highlights…) e helper puri |
| `@olmi/algorithms` | [libs/algorithms](libs/algorithms) | Catalogo di 18 algoritmi di risoluzione (v3.0) + registro e utilities di applicazione |
| `@olmi/logic` | [libs/logic](libs/logic) | Solver, generator e calcolo della difficoltà; orchestrazione degli algoritmi |
| `@olmi/components` | [libs/components](libs/components) | Componenti Angular riusabili (board, toolbar, step-viewer, OCR, generator-options…) |
| `@olmi/templates` | [libs/templates](libs/templates) | Template di stampa (layout pagine A4 con puzzle multipli) |

### Flussi principali

- **Player**: carica uno schema dal catalogo (via API) o manualmente; il giocatore lo risolve a mano o invoca solver/hint/step-by-step. Vedi [documents/player.md](documents/player.md).
- **Generator**: produce schemi nuovi in base a opzioni (numero di valori fissi, simmetria, difficoltà min/max, algoritmi consentiti, workers paralleli). Vedi [documents/generator.md](documents/generator.md).
- **Printer**: impagina uno o più schemi su template A4 (2 o 4 per pagina) e permette la stampa/esportazione. Vedi [documents/printer.md](documents/printer.md).
- **Algorithms**: catalogo di tecniche risolutive con metadati (id, priorità, fattore di difficoltà, tipo). Vedi [documents/alghoritms.md](documents/alghoritms.md).

### Stato & runtime client

- State store RxJS in [libs/components/common/src/lib/store.ts](libs/components/common/src/lib/store.ts) e [app.state.ts](libs/components/common/src/lib/app.state.ts).
- Solver/generator eseguiti in **Web Worker** tramite [logic.worker.ts](libs/components/common/src/lib/logic.worker.ts) e orchestrati da [logic.manager.ts](libs/components/common/src/lib/logic.manager.ts); la UI resta reattiva mentre le worker fanno il lavoro pesante.
- Opzioni utente persistite in localStorage via [user-options.ts](libs/components/common/src/lib/user-options.ts).

---

## API (NestJS)

Definita in [apps/api/src/app](apps/api/src/app). Principali endpoint:

| Metodo | Path | Scopo |
|--------|------|-------|
| GET | `/info` | Informazioni applicative (versione, algoritmi) |
| GET | `/sudoku/list` | Elenco degli schemi del catalogo |
| POST | `/sudoku/check` | Verifica/risolve uno schema |
| POST | `/sudoku/check-all` | Verifica massiva del catalogo |
| POST | `/sudoku/convert` | Conversione di formato |
| POST | `/sudoku/upload` | Importazione di uno schema (file) |
| POST | `/ocr/scan` | Riconoscimento OCR di uno schema da immagine |

Persistenza Mongo tramite `DatabaseModule` ([apps/api/src/database](apps/api/src/database)); schema documento in [apps/api/src/model/sudoku.schema.ts](apps/api/src/model).

Il modulo OCR ([apps/api/src/app/ocr](apps/api/src/app/ocr)) usa `opencv-wasm` per individuare la griglia e `jimp` per il pre-processing, poi legge le celle e restituisce la stringa dello schema (81 caratteri).

---

## Modello di dominio (sintesi)

I tipi cardine vivono in [libs/model/src/lib](libs/model/src/lib):

- **`Sudoku`** / **`SudokuEx`** — descrittore di uno schema (nome, stringa di 81 caratteri, info, celle).
- **`SudokuCell`** — cella (id `rXcY`, valore, `available[]`, gruppi di appartenenza, flag dinamica/fissa).
- **`SudokuGroup`** — riga, colonna o box (9 per tipo).
- **`SudokuStat`** — rank dello schema, conteggi (fissi, dinamici, vuoti, errori).
- **`SudokuInfo` / `SudokuInfoEx`** — simmetria, unicità, origine, versione, difficulty map.
- **`Algorithm`** (classe astratta) / **`AlgorithmResult`** — contratto di ogni tecnica risolutiva (vedi [alghoritms.md](documents/alghoritms.md)).
- **`SolveOptions`** / **`GeneratorOptions`** — parametri di risoluzione/generazione.
- **`Difficulty`** — livello di difficoltà + mappa di utilizzo degli algoritmi.
- **`PrintTemplate`** / **`PrintPage`** — template di stampa (vedi [printer.md](documents/printer.md)).
- **`Highlights`** — evidenziazioni (celle, gruppi, cursori) per la UI e lo step-viewer.

---

## Comandi (Nx)

| Comando | Effetto |
|---------|---------|
| `npm run client` | Serve il frontend Angular (porta default Nx) |
| `npm run api` | Serve l'API NestJS |
| `npm run build` | Build deploy (gulp) |
| `npm start` | Avvia `dist/apps/api/main.js` |

Node richiesto: `20.18.1` (vedi `package.json > engines`).

---

## Documenti correlati

- [documents/alghoritms.md](documents/alghoritms.md) — catalogo completo dei 18 algoritmi v3.0 (id, priorità, fattore, descrizione, tipo).
- [documents/generator.md](documents/generator.md) — funzionamento del generatore (opzioni, simmetrie, workers, calcolo difficoltà).
- [documents/printer.md](documents/printer.md) — tool di stampa (template, pagine A4, flusso di composizione).
- [documents/player.md](documents/player.md) — player (interazione, step-viewer, hint, OCR import).
- [documents/TODO.md](documents/TODO.md) — roadmap e idee in sviluppo.
- [documents/Y-Wing/info.md](documents/Y-Wing/info.md) — approfondimento didattico sull'algoritmo Y-Wing.

---

## Convenzioni di sviluppo

- **Lingua**: commenti e descrizioni di dominio in italiano; identificatori in inglese.
- **Standalone components**: tutte le feature Angular usano componenti standalone (no `NgModule` lato frontend).
- **Worktree**: quando si lavora in un worktree isolato, riportare le modifiche nel branch locale (tipicamente `develop`) **senza commit**, lasciandole come unstaged changes (vedi [../CLAUDE.md](../CLAUDE.md)).
- **Branch corrente**: `master`; branch base per le PR: `main`.
