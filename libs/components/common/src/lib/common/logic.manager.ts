import { EventEmitter, inject } from '@angular/core';
import { LocalContext, LogicExecutor, LogicWorkerArgs, LogicWorkerData } from '@olmi/model';
import { SUDOKU_STORE, SudokuStore } from '@olmi/common';


export class LogicManager implements LogicExecutor {
  private _worker: Worker;
  private _store: SudokuStore;

  completed: EventEmitter<LogicWorkerData> = new EventEmitter<LogicWorkerData>();

  constructor() {
    this._worker = new Worker(new URL('./logic.worker', import.meta.url));
    this._store = inject(SUDOKU_STORE);

    this._worker.onmessage = (m) => {
      const data = new LogicWorkerData(m.data);
      if (data.operation) {
        switch (data.operation) {
          case 'generation-result':
            if (data.generationStat?.generatedSchema) this._store.addGeneratedSchema(data.generationStat.generatedSchema);
            break;
        }
        this.completed.emit(data);
      }
    }
  }

  /**
   * esegue la disposizione sul worker logico
   * @param args
   */
  execute(args: Partial<LogicWorkerArgs>): string {
    args.debug = args.debug||LocalContext.isLevel('debug');
    const eff_args = new LogicWorkerArgs(args);
    this._worker.postMessage(eff_args);
    return eff_args.id;
  }
}
