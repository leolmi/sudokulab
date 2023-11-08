import {GeneratorData} from "./lib/tokens";
import {updateSchema} from "./manager.helper";
import {GeneratorAction, GeneratorWorkerArgs, GeneratorWorkerData} from "./lib/generator.model";
import {PlaySudokuOptions} from "./lib/PlaySudokuOptions";
import {cloneDeep as _clone, extend as _extend} from "lodash";
import {clearSchema, dowloadSchema, getGeneratorCodeAction} from "./sudoku.helper";
import {DataManagerBase} from "./data-manager.base";
import {SudokuLab} from "./lib/logic";
import {map, takeUntil} from "rxjs/operators";

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
  data: GeneratorData;

  constructor(private sudokuLab: SudokuLab,
              data?: GeneratorData,
              o?: Partial<GeneratorDataManagerOptions>) {
    super(data);
    this._options = new GeneratorDataManagerOptions(o);
    this.data = data || new GeneratorData();

    // intercetta i comandi
    sudokuLab.internalCode$.pipe(
      takeUntil(this._destroy$),
      map(code => getGeneratorCodeAction(code)))
      .subscribe((action) => this.handleAction(action));

    // intercetta i comandi
    this.data.action$.pipe(
      takeUntil(this._destroy$))
      .subscribe((action) => this.handleAction(action));
  }

  handleAction(action?: GeneratorAction): void {
    const sdk = _clone(this.data.sdk$.value);
    switch (action) {
      case GeneratorAction.download:
        return dowloadSchema(sdk);
      case GeneratorAction.run:
      case GeneratorAction.stop:
        if (this._worker) this._worker.postMessage(<GeneratorWorkerArgs>{action, sdk});
        break;
      case GeneratorAction.clear:
        if (clearSchema(sdk)) this.data.sdk$.next(sdk);
        break;
      case GeneratorAction.upload:
        this.sudokuLab.upload().subscribe();
        break;
      case GeneratorAction.downloadAll:
        // scarica tutti gli schemi generati
      case GeneratorAction.generate:
        // genera uno schema co i valori inseriti
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
    if (this.data.disabled$.value) return;
    updateSchema(this.data, (sdk) => !!_extend(sdk.options, o))
      .then(() => this.changed$.next());
  }

  /**
   * gestisce le notifiche dall'worker
   * @param data
   */
  handleWorkerData(data: GeneratorWorkerData) {

    // valuta lo stato di running
    if (!!data.status?.running !== this.data.running$.value) {
      this.data.running$.next(!!data.status?.running);
      this.changed$.next();
    }

    // verifica gli schemi generati
    const generated = data.status?.generatedSchema;
    if (generated) {
      const schemas = _clone(this.data.schemas$.value);
      if (!schemas.find(s => s.fixed === generated.fixed)) {
        schemas.push(generated);
        this.data.schemas$.next(schemas);
        this.changed$.next();
      }
    }

    // visualizza i messaggi
    if (data.message) this.sudokuLab.showMessage(data.message);

    // TODO: altro??
  }

  /**
   * inizializza il manager
   * @param worker
   */
  init(worker: Worker) {
    this._worker = worker;
    this._worker.onmessage = (e: MessageEvent) => this.handleWorkerData(<GeneratorWorkerData>e.data);
    this.changed$.next();
  }
}
