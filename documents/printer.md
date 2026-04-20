# Print Tool

Il tool di stampa permette di comporre **documenti PDF/stampabili** che contengono uno o più schemi Sudoku pronti per essere risolti a mano su carta.

Frontend:
- Pagina: [apps/sudoku/src/app/pages/print](../apps/sudoku/src/app/pages/print)
- Entry: [print.component.ts](../apps/sudoku/src/app/pages/print/print.component.ts)
- Singola pagina: [print-page.component.ts](../apps/sudoku/src/app/pages/print/print-page.component.ts)
- Factory documento: [print-document.factory.ts](../apps/sudoku/src/app/pages/print/print-document.factory.ts)

Libreria template:
- [libs/templates](../libs/templates) — catalogo template e composizione HTML.
- Componente generico: [template.component.ts](../libs/templates/src/lib/template.component.ts)

---

## Modello

### `PrintTemplate`
File: [libs/model/src/lib/print-template.ts](../libs/model/src/lib/print-template.ts)

```ts
abstract class PrintTemplate {
  name: string;
  icon: string;
  description: string;
  size: string;           // es. "A4"
  direction: string;      // "vertical" | "horizontal"
  pagesForPage: number;   // puzzle per foglio fisico
  compose: (page: PrintPageEx, last?: boolean) => string; // produce HTML
  editor: Type<any>;      // componente Angular per l'editor dedicato
}
```

### `PrintPage`
File: [libs/model/src/lib/print-page.ts](../libs/model/src/lib/print-page.ts)

```ts
class PrintPage {
  id: string;
  schemas: Dictionary<string>;   // posizione → HTML della cella-template
}

class PrintPageEx extends PrintPage {
  sudokus: Dictionary<Sudoku>;   // posizione → puzzle completo
}
```

Una `PrintPage` è una pagina fisica; ospita `pagesForPage` schemi (2 o 4 a seconda del template). `schemas` contiene frammenti HTML già renderizzati, `sudokus` conserva i dati strutturati per la generazione.

---

## Catalogo template

### `coupleA4V` — 2 per pagina
Path: [libs/templates/src/lib/catalog/coupleA4V](../libs/templates/src/lib/catalog/coupleA4V)

| Proprietà | Valore |
|-----------|--------|
| `name` | "Couple A4V" |
| `size` | A4 |
| `direction` | Verticale |
| `pagesForPage` | 2 |

Layout: due schemi impilati verticalmente su A4 verticale. Esportato come `DEFAULT_PRINT_TEMPLATE`.

### `fourA4V` — 4 per pagina
Path: [libs/templates/src/lib/catalog/fourA4V](../libs/templates/src/lib/catalog/fourA4V)

| Proprietà | Valore |
|-----------|--------|
| `name` | "Four-A4V" |
| `size` | A4 |
| `direction` | Verticale |
| `pagesForPage` | 4 |

Layout: griglia 2×2 di schemi, con sezioni laterali per info (difficoltà, fixed count, try count).

I template sono registrati nell'array `TEMPLATES` di [templates.ts](../libs/templates/src/lib/templates.ts).

---

## Composizione HTML

File: [templates.common.ts](../libs/templates/src/lib/templates.common.ts)

Funzioni helper condivise:

| Funzione | Scopo |
|----------|-------|
| `getBoardHtml(sudoku)` | Genera l'**SVG** della griglia con valori fissi e numerazione |
| `getHeaderHtml(title)` | Intestazione della pagina (titolo "SudokuLab" / branding) |
| `getFooterHtml()` | Footer + page-break CSS per multipagina |

Ogni template ha un proprio `compose(page, last)` che concatena header + griglie + info + footer.

---

## Flusso di stampa

1. **Scelta schemi**: dal [player](player.md), dal [generator](generator.md) o dallo [schemas-browser](../libs/components/schemas-browser), l'utente aggiunge schemi al documento di stampa.
2. **Selezione template**: la UI propone i template del catalogo; il template scelto detta `pagesForPage`.
3. **Popolamento pagine**: [`PrintDocumentFactory`](../apps/sudoku/src/app/pages/print/print-document.factory.ts) costruisce una lista di `PrintPageEx`, ciascuna con `pagesForPage` sudoku.
4. **Render**: per ogni pagina viene invocato `template.compose(page)` → HTML. L'HTML è iniettato nella `template.component.ts` (via token `TEMPLATE_PAGE_ID` e service `SUDOKU_PRINT_DOCUMENT`).
5. **Preview**: la pagina di stampa mostra l'anteprima stampabile nel browser.
6. **Print / Export**: l'utente usa la stampa del browser (`Ctrl+P`) o esporta in PDF (driver stampante); in alternativa si può esportare via `file-saver` se il template lo prevede.

---

## Componente `TemplateComponent`

File: [libs/templates/src/lib/template.component.ts](../libs/templates/src/lib/template.component.ts)

- Inietta `TEMPLATE_PAGE_ID` (id della pagina corrente) e `SUDOKU_PRINT_DOCUMENT` (service con lo stato delle pagine).
- Espone `getSchema$(pos)` — Observable che emette l'HTML dello schema in quella posizione.
- I template concreti usano questo componente come base per rendering slot-based.

---

## Aggiungere un nuovo template

1. Creare una cartella in [libs/templates/src/lib/catalog](../libs/templates/src/lib/catalog) (es. `sixA4H`).
2. Implementare una classe che estende `PrintTemplate` e definisce `compose(page)` combinando gli helper di `templates.common.ts`.
3. Opzionalmente creare un `editor` component dedicato se servono opzioni custom.
4. Registrare il template esportandolo nel catalog `index.ts` e aggiungendolo a `TEMPLATES[]` in `templates.ts`.
5. Verificare che la CSS definisca i `page-break` corretti per il formato scelto.
