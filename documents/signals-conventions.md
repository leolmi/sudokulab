# Convenzioni Signal — SudokuLab

Questo documento fissa le regole di stile e di architettura adottate durante la rifattorizzazione progressiva del client a Signal (Angular 21). Vale come riferimento sia per le fasi del refactor (vedi [TODO.md](../TODO.md)) sia per ogni nuovo componente/servizio scritto da qui in avanti.

> **Filosofia**: ogni componente toccato deve uscire dalla rifattorizzazione nella forma più moderna prevista da Angular 21. Se un componente è "in mezzo" tra vecchio e nuovo è un debito, non un compromesso.

---

## 1. Naming

| Caso | Convenzione | Esempio |
|------|-------------|---------|
| Signal pubblico (lettura) | nome senza suffisso | `readonly catalog = signal<Sudoku[]>([])` |
| Signal privato/interno | prefisso `_` | `private readonly _busy = signal(false)` |
| Computed pubblico | nome senza suffisso | `readonly hasItems = computed(() => this.catalog().length > 0)` |
| Observable residuo (HTTP, worker) | suffisso `$` (eccezione) | `readonly result$: Observable<…>` |
| Compat shim Fase 1 (store) | suffisso `$` | `readonly catalog$ = toObservable(this.catalog)` |

Niente `Subject`/`BehaviorSubject` come campo pubblico di componente. I residui ammessi sono:
- `HttpClient` body (sorgente esterna che resta `Observable`);
- worker boundary (`postMessage` wrappato in `Subject`, ma esposto come `Signal` via `toSignal()`).

---

## 2. Visibilità e contratto store/servizi

- Lo stato esposto da uno store è `Signal<T>` **readonly**.
- Le mutazioni passano per metodi pubblici espliciti (`setCatalog(c: Sudoku[])`, `addGenerated(s: SudokuEx)`, `clear()`).
- Internamente lo store usa `WritableSignal<T>` privato; non esporre mai il signal scrivibile.
- Iniezione: `inject(Service)` ovunque, niente constructor injection nei componenti rifattorizzati.

```ts
@Injectable({ providedIn: 'root' })
export class SudokuStore {
  private readonly _catalog = signal<Sudoku[]>([]);
  readonly catalog = this._catalog.asReadonly();
  readonly hasCatalog = computed(() => this._catalog().length > 0);

  setCatalog(items: Sudoku[]) { this._catalog.set(items); }
  addGenerated(s: SudokuEx)   { this._generated.update(g => [...g, s]); }
}
```

---

## 3. Contratto del componente

| Aspetto | Vecchio | Nuovo |
|---------|---------|-------|
| Standalone | richiesto | richiesto, già 100% sul progetto |
| Change detection | `Default` o `OnPush` | **`OnPush` obbligatorio** |
| Input | `@Input()` decoratore | `input<T>()` / `input.required<T>()` |
| Output | `@Output() … = new EventEmitter()` | `output<T>()` |
| Two-way | `[v]` + `(vChange)` manuali | `model<T>()` |
| ViewChild | `@ViewChild()` | `viewChild()` / `viewChild.required()` |
| ContentChild | `@ContentChild()` | `contentChild()` |
| Lifecycle | `Subject<void> _destroy$` + `ngOnDestroy` | `takeUntilDestroyed(inject(DestroyRef))` |

### Esempio completo

```ts
@Component({
  selector: 'sudokulab-step-viewer',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './step-viewer.component.html',
  styleUrls: ['./step-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepViewerComponent {
  readonly steps = input.required<AlgorithmResult[]>();
  readonly current = model<number>(0);
  readonly closed = output<void>();

  protected readonly currentStep = computed(() => this.steps()[this.current()] ?? null);

  next() { this.current.update(i => Math.min(i + 1, this.steps().length - 1)); }
  prev() { this.current.update(i => Math.max(i - 1, 0)); }
}
```

---

## 4. Modello reattivo nei componenti

- **Stato locale** → `signal()`.
- **Stato derivato** → `computed()`. **Mai** mutare un signal dentro un `computed`.
- **Side effects** (DOM diretto, `localStorage`, `postMessage`, log) → `effect()`. Non chiamare `.set()` su un signal letto dall'effect stesso (loop).
- **Sorgenti async** (HTTP, worker) → `toSignal(observable, { initialValue })`. Per gli `Observable` che si vogliono ascoltare imperativamente usare `.subscribe()` + `takeUntilDestroyed()`.

### Quando NON usare `effect()`
- Per calcolare un valore derivato (è il lavoro di `computed`).
- Per propagare dati allo store/servizio in modo immediato (chiama il metodo del servizio nel handler dell'evento, non in un effect).

---

## 5. Lifecycle e teardown

```ts
private readonly destroyRef = inject(DestroyRef);

constructor() {
  this.someService.events$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(e => this.handle(e));
}
```

- `DestroyComponentBase` resta in vita per i componenti non ancora rifattorizzati ma è **deprecata**: nessun nuovo componente la estende. Rimossa in Fase 5.
- `ngOnDestroy` resta legittimo solo per teardown manuale di risorse non-Rx (timer, listener globali). In quei casi si può usare `inject(DestroyRef).onDestroy(fn)` come alternativa.

---

## 6. Template

- **Niente `| async`**: leggere il signal direttamente (`{{ catalog().length }}`).
- **`@let`** per de-duplicare letture multiple dello stesso signal o di un suo `computed`:
  ```html
  @let c = current();
  @if (c) {
    <span>{{ c.label }}</span> – <strong>{{ c.score }}</strong>
  }
  ```
- **Control flow nativo**: `@if`, `@for`, `@switch`. Niente `*ngIf`, `*ngFor`, `*ngSwitch` nei file rifattorizzati.
- **`track`** sempre esplicito in `@for`:
  ```html
  @for (s of catalog(); track s.id) { … }
  ```
- Niente `ChangeDetectorRef.detectChanges()`/`markForCheck()` se la reattività passa per signal — è ridondante.

---

## 7. Servizi: linee guida

- I **servizi singleton** (store, manager) espongono `Signal<T>` readonly e metodi imperativi.
- I **servizi che wrappano fonti async** (HTTP, worker) restituiscono `Observable<T>` per la primitiva, ma forniscono varianti `…Signal()` (basate su `toSignal()`) quando il consumer è un componente.
- I **manager con stato interno** (`LogicManager`, `BoardManager`) usano signal interni e — se devono emettere eventi non-stato — un `Subject<T>` privato esposto come `readonly events: Signal<T | null>` via `toSignal()`.

```ts
@Injectable({ providedIn: 'root' })
export class LogicManager {
  private readonly _completed = new Subject<LogicWorkerData>();
  readonly completed = toSignal(this._completed, { initialValue: null });

  run(args: LogicWorkerArgs) { /* postMessage … */ }
}
```

---

## 8. Cosa **non** cambia

- `HttpClient` resta basato su `Observable` (è la API ufficiale Angular).
- I worker comunicano via `postMessage`; il wrapping a Signal avviene nel manager, non nel worker.
- `AppUserOptions` (localStorage statico) non ha state reattivo: lo lasciamo com'è, eventualmente lo trasformiamo in servizio con signal solo se un componente lo richiede.
- Pipe puri esistenti (`ItemTooltipPipe`, `UserPlayingPipe`) non sono RxJS-based: nessuna modifica.

---

## 9. Checklist per componente migrato

Da spuntare in PR (o nel commit) per ogni componente toccato:

- [ ] `standalone: true` con `imports: [...]` espliciti
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] zero `BehaviorSubject` / `Subject` come campo del componente (ad eccezione di teardown manuale)
- [ ] zero `@Input` / `@Output` decoratori → `input()` / `output()`
- [ ] zero `| async` nel template
- [ ] zero `takeUntil(_destroy$)` → `takeUntilDestroyed()`
- [ ] zero `*ngIf` / `*ngFor` / `*ngSwitch` → `@if` / `@for` / `@switch`
- [ ] `@for` ha sempre `track`
- [ ] `viewChild()` / `contentChild()` signal-based dove serve
- [ ] `@let` usato per de-duplicare letture nei template
- [ ] `inject()` invece di constructor injection
- [ ] non estende `DestroyComponentBase`
- [ ] template e logica privi di `markForCheck()` / `detectChanges()` superflui
- [ ] feature toccata testata manualmente (player / generator / print / management secondo pertinenza)

---

## 10. Rollout

- **Una fase = un PR** mergeabile, con patch-bump di `package.json` (vedi memoria interna sull'auto-bump).
- Dentro una fase, **un componente per commit** quando l'ambito lo consente.
- Per la Fase 1 (store) la regola del "un componente per commit" non si applica: store + compat shim sono un unico cambio atomico.
- Se durante una fase emerge un problema fuori scope, va aggiunto al [TODO.md](../TODO.md), non risolto inline.
