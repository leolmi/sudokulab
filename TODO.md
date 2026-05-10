## DA FARE
- [ ] verifiche su Observables di BoardManager;
- [ ] manca refactoring su componenti:
    - [ ] libs\components\schema-keeper\src\lib\schema-keeper-dialog;
    - [ ] libs\components\schema-keeper\src\lib\schema-keeper-error-dialog;

## FATTI
- [x] verifica tema su picker;
- [x] **Fix loop infinito post-Signal refactor** (v3.0.20) — in `extendStatus(cs, ps)` ([schema-toolbar.helper.ts](libs/components/schema-toolbar/src/lib/schema-toolbar/schema-toolbar.helper.ts)) la lettura `cs()` + `cs.set(...)` veniva eseguita dentro un `effect()` di `SchemaToolbarComponent`, registrando `cs` come dipendenza dell'effect e ritriggerando il re-run su ogni `set` → loop infinito (l'app freezava al boot, prima che il browser potesse caricare anche il font). Risolto sostituendo con `cs.update(prev => …)`, che legge il valore precedente fuori dal tracking context. Drop concomitante di `LogicManager.completedSignal` (toSignal di un `Subject`, mai consumato).
- [x] **Rifattorizzazione graduale a Signal** (5 fasi, v3.0.14 → v3.0.19) — eliminato `BehaviorSubject` e `| async` dai componenti, modernizzazione completa del client (Angular 21). Convenzioni in [documents/signals-conventions.md](documents/signals-conventions.md).
  - **Fase 0 — Fondamenta**: convenzioni e checklist per componente; `takeUntilDestroyed()` adottato come standard; nota in [CLAUDE.md](CLAUDE.md);
  - **Fase 1 — Store e State**: `SudokuStore` e `SudokuState` rifattorizzati signal-first (`signal`/`computed`/`effect`/`toSignal`); compat `xxx$` introdotto per migrazione graduale (rimosso poi in Fase 5);
  - **Fase 2 — Componenti foglia**: `StepViewerComponent` (pilot, `linkedSignal`), `SchemaHeaderComponent`, `ServerWaiterComponent`, `SchemaToolbarComponent`; i due dialog (`SchemaKeeperErrorDialog`, `AlgorithmsSelectorDialog`) erano già conformi;
  - **Fase 3 — Page e container**: `PageBase`, `AppComponent`, `PlayerComponent`, `GeneratorComponent`, `PrintComponent`, `PrintPageComponent`, `ManagementComponent`, `MapsComponent`, `InfosComponent`, `GeneratorOptionsComponent` (qui rimosso l'ultimo `| async` di `apps/sudoku/**`);
  - **Fase 4 — Board e BoardManager**: `BoardManager` con API ibrida (signal accanto ai `BehaviorSubject` mantenuti come sorgente di verità), `BoardComponent` (8 BS → signal, `viewChild()`, `input()`/`output()`, metodi `setCells/setStatus/setHighlights` per gli scrivers da manager), `CellRadialPickerComponent`, `BoardPreviewComponent`, `GeneratorSchemasComponent`, `GeneratorSchemaPreviewComponent`, `HighlightsEditorComponent`;
  - **Fase 5 — Worker boundary, cleanup**: `LogicManager.completed: EventEmitter` → `Subject` interno + `Observable` pubblico + `completedSignal` via `toSignal()`; rimozione del compat `xxx$` da `SudokuStore` (6 rimossi) e `SudokuState` (11 rimossi + `isRunning$` statico); migrazione dei 3 consumer residui (`SchemasBrowser`, `SchemasToolbar`, `SchemasDialog`); eliminazione di `DestroyComponentBase` e `ManagerComponentBase`;
  - **Rinviato — fuori scope**: verifica fattibilità app **zoneless** (richiede revisione di `setTimeout`/`requestAnimationFrame` nelle worker callback).
- [x] upgrade nx/angular to latest version;
- [x] controllo intelligente per inserimento valori in cella con visore circolare:
  - touch (o click) prolungati su cella aprono visore radiale con centro nella cella;
  - il visore contiene tutti i valori e quello per valore empty disposti a raggera;
  - senza togliere il touch (o il click) lo spostamento verso uno dei valori periferici
    innesca la valorizzazione e la chiusura del visore;
