## DA FARE
- [ ] multilingua (ita - en);
- [ ] player su soluzione: la toolbar dei valori si trasformerebbe in una toolbar di player con i
  comandi avanti, indietro per navigare negli step di risoluzione con il testo dei vari step;
- [ ] player di highligths per animazioni. Nuove words:
  - strutturali:
    - `label`: scrive testo:
      ````
      label {text}:{position}:{color}
      ````
    - `path`: genera percorsi lineari da cella a cella:
      ````
      path {cell1}[,{cell2}[,...]]:{color}
      ````
  - dispositive
    - `clear`: elimina tutti gli highlights attivi
      ````
      clear
      ````
    - `pause`: aspetta tempo o interazione utente
      ````
      pause {milliseconds|input}
      ````      
    - `value`: valorizza cella o modifica i valori possibili
      ````
      value {target1=value1}[,{target2=value2}[,...]]
      ````
    - `option`: imposta un'opzione temporanea (solo per l'animazione) per la griglia
      ````
      option {option}:{value}
      ````
- [ ] generare highlights come animazioni dalla soluzione dello schema
- [ ] gioco a tempo (nelle pause diventa "blurizzato")

## FATTI
- [x] aggiornare l'help dell'applicazione;
- [x] verifica tema su picker;
- [x] **Refactor signal-first finale** (v3.0.26) — chiusura del debito residuo Fase 4 + ondata di pulizia trasversale:
  - **BoardManager**: da classe `new BoardManager(...)` a `@Injectable` headless per-board (provider sui consumer); rovesciamento dipendenza con `BoardComponent`; rimossi output `onReady`/`boardChangeRequest`/`selectionChanged` e input `[manager]`; 12 `BehaviorSubject` → 12 `Signal` readonly + setter espliciti; focus DOM via signal-counter `focusTick`.
  - **Interaction**: 5 metodi HTTP `Observable<T>` → `Promise<T>` via `firstValueFrom`; consumer (`SudokuStore.checkSchema`, `app.state.ping`, `management.updateCatalog`, `schema-keeper._manageScan`) migrati a async/await.
  - **PrintDocument**: 3 BS + 2 Observable derivati → `Signal` readonly + `computed`; setter espliciti (`setTemplate`/`setActiveArea`/`clearPages`); 6 `toSignal()` rimossi nei 5 consumer.
  - **LocalContext**: `BehaviorSubject changed$` + `isDebugMode$ Observable` → `_tick: signal` + `isDebugMode: Signal computed`.
  - **ServerBusyService**: `state$/isBusy$ Observable` → signal+computed; rimozione token `SERVER_BUSY_SERVICE` morto.
  - **RxJS legittimo rimasto**: `GeneratorContext` (worker, framework-agnostic), `LogicManagerBase.completed` (evento worker), `Interaction` interno (`firstValueFrom`), `serverBusyInterceptor` (API `HttpInterceptorFn`), `app.state.route` (Router non ancora signal-native).
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
- [x] verifiche su Observables di BoardManager;
- [x] manca refactoring su componenti:
  - [x] libs\components\schema-keeper\src\lib\schema-keeper-dialog;
  - [x] libs\components\schema-keeper\src\lib\schema-keeper-error-dialog;
