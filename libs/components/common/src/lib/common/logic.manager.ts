import { EventEmitter, inject } from '@angular/core';
import {
  checkNumber,
  GeneratorOptions,
  LocalContext,
  LogicExecutor,
  LogicWorkerArgs,
  LogicWorkerData
} from '@olmi/model';
import { AppUserOptions, SUDOKU_STORE, SudokuStore } from '@olmi/common';
import { GENERATOR_OPTIONS_FEATURE } from '@olmi/board';


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
 * gestisce N worker paralleli per la logica
 */
export class MultiLogicManager extends LogicManagerBase implements LogicExecutor {
  static count = 1;
  private _workers: Worker[] = [];

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

  /**
   * esegue la disposizione sul worker logico
   * @param args
   */
  execute(args: Partial<LogicWorkerArgs>): string {
    return this._execute(args, (eff) =>
      this._workers.forEach(w => w.postMessage(eff)));
  }
}
