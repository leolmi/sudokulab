import {GeneratorData} from "./lib/tokens";
import {updateSchema} from "./manager.helper";
import {GeneratorAction, GeneratorWorkerArgs, GeneratorWorkerData} from "./lib/generator.model";
import {GeneratorOptions, PlaySudokuOptions} from "./lib/PlaySudokuOptions";
import {cloneDeep as _clone, extend as _extend} from "lodash";
import {clearSchema, dowloadSchema, getGeneratorCodeAction, resetAvailable} from "./sudoku.helper";
import {DataManagerBase} from "./data-manager.base";
import {checkAvailable, SudokuLab} from "./lib/logic";
import {debounceTime, distinctUntilChanged, filter, map, takeUntil} from "rxjs/operators";
import {NgZone} from "@angular/core";
import {loadGeneratorUserData, saveGeneratorUserData} from "./lib/userdata";

export class GeneratorDataManagerOptions {
  constructor(o?: Partial<GeneratorDataManagerOptions>) {
    Object.assign(this, o || {});
  }
}

/**
 * GESTORE DI GENERATOR-DATA
 * - gestisce gli eventi da tastiera
 * - gestisce le modifiche
 */
export class GeneratorDataManager extends DataManagerBase {
  private _worker: Worker|undefined;
  private _options: GeneratorDataManagerOptions;
  generator: GeneratorData;

  constructor(private _zone: NgZone,
              private _sudokuLab: SudokuLab,
              generator?: GeneratorData,
              o?: Partial<GeneratorDataManagerOptions>) {
    super(generator);
    this._options = new GeneratorDataManagerOptions(o);
    this.generator = generator || new GeneratorData();
    loadGeneratorUserData(this.generator);

    // intercetta i comandi
    _sudokuLab.internalCode$.pipe(
      takeUntil(this._destroy$),
      map(code => getGeneratorCodeAction(code)),
      filter(action => !!action))
      .subscribe((action) => this.handleAction(action));

    // intercetta i comandi
    this.generator.action$.pipe(
      takeUntil(this._destroy$))
      .subscribe((action) => this.handleAction(action));

    this.generator.sdk$.pipe(
      takeUntil(this._destroy$),
      filter(sdk => !!sdk),
      debounceTime(100))
      .subscribe((sdk) => {
        saveGeneratorUserData(sdk);
        this.changed$.next();
      });

    this.generator.running$
      .pipe(distinctUntilChanged())
      .subscribe((run) => this.generator.disabled$.next(run));
  }

  handleAction(action?: GeneratorAction): void {
    const sdk = _clone(this.generator.sdk$.value);
    switch (action) {
      case GeneratorAction.download:
        return dowloadSchema(sdk);
      case GeneratorAction.run:
      case GeneratorAction.stop:
        if (this._worker) this._worker.postMessage(<GeneratorWorkerArgs>{action, sdk});
        break;
      case GeneratorAction.clear:
        if (clearSchema(sdk, true)) this.generator.sdk$.next(sdk);
        break;
      case GeneratorAction.check:
        resetAvailable(sdk, { onlyRealFixed: true });
        checkAvailable(sdk, { fixedAsValue: true });
        this.generator.sdk$.next(sdk);
        break;
      case GeneratorAction.upload:
        this._sudokuLab.upload().subscribe();
        break;
      case GeneratorAction.downloadAll:
        // scarica tutti gli schemi generati
      case GeneratorAction.generate:
        // genera uno schema con i valori inseriti
      case GeneratorAction.openInLab:
        // apre lo schema selezionato in lab
      case GeneratorAction.removeAll:
        // elimina tutti gli schemi generati (conferma)
      default:
        console.warn('not handled action', action);
        break;
    }
  }

  /**
   * aggiorna le opzioni dello schema
   * @param o
   */
  setOptions(o: Partial<PlaySudokuOptions>) {
    if (this.generator.disabled$.value) return;
    updateSchema(this.generator, (sdk) => !!_extend(sdk.options, o))
      .then(() => this.changed$.next());
  }

  /**
   * aggiorna le opzioni per il generatore
   * @param o
   */
  updateGeneratorOptions(o?: Partial<GeneratorOptions>) {
    if (this.generator.disabled$.value) return;
    const sdk = this.generator.sdk$.value;
    const generator = _clone(sdk.options?.generator);
    _extend(generator, o);
    this.setOptions({ generator });
  }

  /**
   * gestisce le notifiche dall'worker
   * @param data
   */
  handleWorkerData(data: GeneratorWorkerData) {

    // valuta lo stato di running
    const running = !!data.status?.running;
    if (this.generator.running$.value !== running) {
      this.generator.running$.next(running);
      this.changed$.next();
    }

    const stopping = !!data.status?.stopping;
    if (this.generator.stopping$.value !== stopping) {
      this.generator.stopping$.next(stopping);
      this.changed$.next();
    }

    // verifica gli schemi generati
    const generated = data.status?.generatedSchema;
    if (generated) {
      const schemas = _clone(this.generator.schemas$.value);
      if (!schemas.find(s => s.fixed === generated.fixed)) {
        schemas.push(generated);
        this.generator.schemas$.next(schemas);
        this.changed$.next();
      }
    }

    // visualizza i messaggi
    if (data.message) this._sudokuLab.showMessage(data.message);

    // TODO: altro??
  }

  /**
   * inizializza il manager
   * @param handler
   */
  init(handler: () => Worker) {
    if (!this._worker) {
      this._worker = handler();
      this._worker.onmessage = (e: MessageEvent) =>
        this._zone.run(() => this.handleWorkerData(<GeneratorWorkerData>e.data));
    }
    this.changed$.next();
  }
}
