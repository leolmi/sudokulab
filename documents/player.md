# Player

Il player è la pagina principale di SudokuLab: permette di **giocare**, **risolvere** e **apprendere** tecniche di risoluzione su schemi esistenti (dal catalogo, appena generati o importati).

Frontend:
- Pagina: [apps/sudoku/src/app/pages/player](../apps/sudoku/src/app/pages/player)
- Componente: [player.component.ts](../apps/sudoku/src/app/pages/player/player.component.ts)
- Manifest / menu / routes: `player.manifest.ts`, `player.menu.ts`, `player.routes.ts`
- Rotta: `/player/:id?` — se presente `id`, carica lo schema dal catalogo.

---

## Anatomia della pagina

La UI si compone di alcuni componenti della libreria [libs/components](../libs/components):

| Zona | Componente | Ruolo |
|------|-----------|-------|
| Intestazione | [`schema-header`](../libs/components/schema-header) | Titolo schema, badge difficoltà, conteggi algoritmi |
| Dettagli | [`schema-details`](../libs/components/schema-details) | Metadati (origine, simmetria, versione, unicità) |
| Toolbar | [`schema-toolbar`](../libs/components/schema-toolbar) | Azioni: solve, hint, step, clear, save, undo/redo, progress |
| Griglia | [`board`](../libs/components/board) | Griglia interattiva 9×9 (mouse + tastiera, pencil marks, highlights) |
| Step viewer | [`step-viewer`](../libs/components/step-viewer) | Sequenza degli algoritmi applicati con dettaglio step |
| Dialog solve-to | [`solve-to-dialog`](../libs/components/solve-to-dialog) | Avanzamento passo-passo con spiegazione dell'algoritmo corrente |
| Keeper | [`schema-keeper`](../libs/components/schema-keeper) | Salvataggio dello schema (anche drag&drop file, OCR) |
| Highlights editor | [`highlights-editor`](../libs/components/highlights-editor) | Editor JSON degli highlights (modalità avanzata) |
| Browser schemi | [`schemas-browser`](../libs/components/schemas-browser) | Dialog per selezionare uno schema dal catalogo |

Le OCR-components ([`ocr-components`](../libs/components/ocr-components)) permettono di importare uno schema da immagine (crop, mappa celle, risoluzione dubbi).

---

## Interazione sul board

Implementazione: [board.component.ts](../libs/components/board/src/lib) + helpers (`board.helper.ts`, `board.manager.ts`, `board.internal.ts`).

- **Click**: seleziona la cella.
- **Tastiera**: frecce per navigare; cifre 1–9 per inserire un valore; `Delete/Backspace` per rimuovere; modificatori per pencil marks (candidati).
- **Pencil marks**: cella con multipli candidati visualizzati in piccolo; possibile attivare modalità "note".
- **Highlights**: celle, gruppi o cursori evidenziati (colori distintivi) per mostrare l'effetto di un algoritmo.
- **Errori**: celle con violazione (duplicato in gruppo) evidenziate tramite `SudokuError`.

Stato del board: gestito dai manager (`board.manager.ts`) e pubblicato via RxJS sul [common store](../libs/components/common/src/lib/store.ts).

---

## Azioni principali (toolbar)

Esposte da [`schema-toolbar.component.ts`](../libs/components/schema-toolbar):

| Azione | Effetto |
|--------|---------|
| **Solve** | Risolve completamente lo schema invocando il solver di `@olmi/logic` |
| **Step** | Applica un singolo algoritmo (il primo applicabile in ordine di priorità) |
| **To step** | Applica algoritmi finché non ricorre un certo pattern / modalità `to-step` |
| **To try** | Risolve fino a dover ricorrere al brute-force (`TryNumber`); si ferma prima |
| **Hint** | Mostra un suggerimento sul prossimo algoritmo applicabile, senza valorizzare |
| **Undo / Redo** | Ripristina stato precedente / successivo |
| **Clear** | Svuota i valori dinamici, mantenendo le celle fisse |
| **Save** | Salva in catalogo / file |

L'esecuzione avviene in Web Worker ([logic.worker.ts](../libs/components/common/src/lib/logic.worker.ts)) per non bloccare la UI. Il progress è riportato nella toolbar.

---

## Step Viewer

File: [step-viewer.component.ts](../libs/components/step-viewer/src/lib), logic in `step-viewer.logic.ts`.

Trasforma la sequenza di `AlgorithmResult` (prodotta dal solver) in un elenco visualizzabile:

- Per ogni step: nome algoritmo, icona, celle interessate, righe descrittive, highlights preview.
- Selezionando uno step il board mostra lo **snapshot delle celle** in quel punto della risoluzione: si può scorrere il processo logico come in un debugger.
- Lo step viewer è integrato nel player per l'apprendimento (TODO.md → "player di highlights per animazioni" per sviluppi futuri).

---

## Modalità risoluzione supportate (solver)

Definite in [`SolveOptions`](../libs/model/src/lib/solver.ts), usate dal player tramite i comandi della toolbar:

| Modalità | Descrizione |
|----------|-------------|
| `all` | Risolve l'intero schema |
| `one-step` | Applica un singolo step |
| `to-step` | Procede fino a uno step specifico |
| `to-try` | Si ferma prima di ricorrere a `TryNumber` |

Il flag `allowTryAlgorithm` determina se il brute-force è consentito nella sessione corrente.

---

## Import da immagine (OCR)

Il player include un flusso OCR (soggetto a sviluppo, vedi TODO.md):

1. L'utente carica un'immagine.
2. [`ocr-image-crop.component`](../libs/components/ocr-components) permette di definire l'area della griglia.
3. L'API `POST /ocr/scan` riceve l'immagine e restituisce:
   - la stringa schema (81 caratteri);
   - eventuali **dubbi** (`OcrScanDoubt`) per celle ambigue.
4. [`ocr-doubts.component`](../libs/components/ocr-components) chiede all'utente di risolvere i dubbi manualmente.
5. [`ocr-image-map.component`](../libs/components/ocr-components) sovrappone una mappa delle celle rilevate.

Il backend OCR ([apps/api/src/app/ocr](../apps/api/src/app/ocr)) usa `opencv-wasm` per la detection della griglia e `jimp` per il pre-processing.

---

## Logica specifica della pagina

File: [player.logic.ts](../apps/sudoku/src/app/pages/player/player.logic.ts) — dichiara il token `SUDOKU_PAGE_PLAYER_LOGIC` per iniettare un `LogicExecutor` dedicato al player (separa l'executor del player da quello del generator).

Componente base pagina: [page.base.ts](../apps/sudoku/src/app/model/page.base.ts) — ciclo di vita comune a tutte le pagine (cleanup RxJS, gestione manifest e menu).

---

## Persistenza dello stato

- **Opzioni utente** (modalità, preferenze UI): salvate in localStorage via [`user-options.ts`](../libs/components/common/src/lib/user-options.ts).
- **Schema corrente**: parte dell'app state ([`app.state.ts`](../libs/components/common/src/lib/app.state.ts)); all'uscita/reload viene ricaricato dall'ID URL.
- **Salvataggio esplicito nel catalogo**: via `schema-keeper` → API `POST /sudoku/upload`.

---

## Estensione / sviluppi futuri

Vedi [TODO.md](TODO.md) per le idee in roadmap:
- Gestione preferiti.
- Opzionabilità degli algoritmi usati dal risolutore direttamente in UI.
- Popup di help per ciascun algoritmo (documentazione in-app).
- Animazioni guidate dagli highlights (nuove primitive `label`, `path`, `pause`, `value`, `option`, `clear`).
- Modalità "gioco a tempo" con blur nelle pause.
