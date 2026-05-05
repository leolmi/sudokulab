import { EventEmitter, inject } from '@angular/core';
import {
  checkNumber,
  GeneratorOptions,
  LocalContext,
  LogicExecutor,
  LogicWorkerArgs,
  LogicWorkerData
} from '@olmi/model';
import { SUDOKU_STORE, SudokuStore } from './store';
import { AppUserOptions } from './user-options';
import { GENERATOR_OPTIONS_FEATURE } from './constants';



class LogicManagerBase {
  private _store: SudokuStore;

  completed: EventEmitter<LogicWorkerData> = new EventEmitter<LogicWorkerData>();

  constructor() {
    this._store = inject(SUDOKU_STORE);
  }

  protected _handleMessage(m: MessageEvent, index?: number) {
    const data = new LogicWorkerData(m.data);
    data.index = index||0;
    if (data.operation) {
      switch (data.operation) {
        case 'generation-result':
          if (data.generationStat?.generatedSchema) this._store.addGeneratedSchema(data.generationStat.generatedSchema);
          break;
      }
      this.completed.emit(data);
    }
  }

  /**
   * esegue la disposizione
   * @param args
   * @param handler
   */
  protected _execute(args: Partial<LogicWorkerArgs>, handler: (a: LogicWorkerArgs) => void): string {
    args.debug = args.debug||LocalContext.isLevel('debug');
    const eff_args = new LogicWorkerArgs(args);
    handler(eff_args);
    return eff_args.id;
  }

  /**
   * genera e binda un nuovo worker
   * @protected
   */
  protected _createWorker(index?: number): Worker {
    const w = new Worker(new URL('./logic.worker', import.meta.url));
    w.onmessage = (m) => this._handleMessage(m, index);
    return w;
  }
}

/**
 * gestisce un worker per la logica
 */
export class LogicManager extends LogicManagerBase implements LogicExecutor {
  private _worker: Worker;

  constructor() {
    super();
    this._worker = this._createWorker();
  }

  /**
   * esegue la disposizione sul worker logico
   * @param args
   */
  execute(args: Partial<LogicWorkerArgs>): string {
    return this._execute(args, (eff) => this._worker.postMessage(eff));
  }
}

/**
 * gestisce N worker paralleli per la logica.
 *
 * Coordinazione globale per la generazione: i worker sono indipendenti e
 * partono dallo stesso input, quindi senza coordinazione tendono a duplicare
 * il lavoro. Il manager fa da gatekeeper sul flusso `generation-result`
 * usando il `canonicalId` di ogni schema:
 *
 *  - per ogni orbita (canonicalId) accetta al massimo `variantsCount` emissioni
 *  - dopo `maxOrbits` orbite distinte droppa nuove orbite e invia `stop`
 *
 * Le emissioni filtrate non vengono propagate allo store. Il segnale `stop`
 * viene inviato a tutti i worker quando il budget complessivo è esaurito,
 * per evitare che continuino a calcolare schemi che andrebbero scartati.
 */
export class MultiLogicManager extends LogicManagerBase implements LogicExecutor {
  static count = 1;
  private _workers: Worker[] = [];
  // canonicalId → set di `values` distinti già accettati per quella orbita.
  // Usiamo un Set, non un counter, perché tutti i worker partono dallo stesso
  // input: la prima emissione di ognuno è lo stesso schema. Contandole tutte
  // saturerebbe il budget con duplicati.
  private _seenValuesByOrbit: Map<string, Set<string>> = new Map();
  private _maxOrbits = 1;
  private _variantsCount = 1;
  private _stopSent = false;

  constructor() {
    super();
    const o = AppUserOptions.getFeatures(GENERATOR_OPTIONS_FEATURE, new GeneratorOptions());
    const len = checkNumber(o.workersLength, 1, 10);
    MultiLogicManager.count = len;
    const url = new URL('./logic.worker', import.meta.url);
    for (let i = 0; i < len; i++) {
      this._workers.push(this._createWorker(i));
    }
  }

  protected override _handleMessage(m: MessageEvent, index?: number) {
    const data = new LogicWorkerData(m.data);
    if (data.operation === 'generation-result' && this._shouldFilter(data)) {
      return;
    }
    super._handleMessage(m, index);
  }

  /**
   * Decide se questa emissione va scartata in base ai vincoli globali.
   * Se l'emissione completa il budget, invia `stop` ai worker.
   *
   * Logica:
   *  - duplicato esatto (stesso `values` già accettato): drop silenzioso
   *  - orbita nuova oltre `maxOrbits`: drop + stop
   *  - orbita nota ma budget `variantsCount` esaurito: drop
   *  - altrimenti: accetta e registra
   */
  private _shouldFilter(data: LogicWorkerData): boolean {
    const sdk = data.generationStat?.generatedSchema;
    const cid = sdk?.info?.canonicalId;
    // schemi senza canonicalId: passa (legacy / sicurezza)
    if (!cid || !sdk) return false;

    const values = sdk.values;
    let seen = this._seenValuesByOrbit.get(cid);

    // duplicato esatto (più worker hanno generato lo stesso schema): drop
    if (seen?.has(values)) return true;

    const isNewOrbit = !seen;

    // orbita nuova oltre il limite globale: drop + stop
    if (isNewOrbit && this._seenValuesByOrbit.size >= this._maxOrbits) {
      this._sendStop();
      return true;
    }

    // budget per-orbita esaurito (`variantsCount` schemi distinti già accettati)
    if (seen && seen.size >= this._variantsCount) return true;

    // accetto e registro
    if (!seen) {
      seen = new Set<string>();
      this._seenValuesByOrbit.set(cid, seen);
    }
    seen.add(values);

    // se tutte le orbite raggiunte hanno saturato il budget, segnala stop
    if (this._seenValuesByOrbit.size >= this._maxOrbits) {
      let allFull = true;
      for (const s of this._seenValuesByOrbit.values()) {
        if (s.size < this._variantsCount) { allFull = false; break; }
      }
      if (allFull) this._sendStop();
    }

    return false;
  }

  private _sendStop() {
    if (this._stopSent) return;
    this._stopSent = true;
    const stopArgs = new LogicWorkerArgs({ operation: 'stop' });
    this._workers.forEach(w => w.postMessage(stopArgs));
  }

  /**
   * Resetta lo stato di coordinazione all'inizio di ogni nuova generazione.
   */
  private _resetCoordination(args: LogicWorkerArgs) {
    const opts = args.options as Partial<GeneratorOptions> | undefined;
    this._seenValuesByOrbit.clear();
    this._maxOrbits = opts?.maxOrbits || 1;
    this._variantsCount = opts?.variantsCount || 1;
    this._stopSent = false;
  }

  /**
   * esegue la disposizione sul worker logico
   * @param args
   */
  execute(args: Partial<LogicWorkerArgs>): string {
    return this._execute(args, (eff) => {
      if (eff.operation === 'generate') this._resetCoordination(eff);
      this._workers.forEach(w => w.postMessage(eff));
    });
  }
}
