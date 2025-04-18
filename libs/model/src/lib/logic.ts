import { getGlobalErrorMessage } from '../errors.helper';
import { ValueOptions } from './value-options';
import { Sudoku } from './sudoku';
import { guid } from '../generic.helper';
import { GenerationStat } from './generator';

export type LogicOperation = 'check'|'solve'|'stop'|'solve-step'|'solve-to'|'solve-to-try'|'clear'|'help'|'generate'|'skip'|'generation-result'|'generation-ping'|'assign'|'toggle'|'build';


export class LogicWorkerBase {
  constructor(a?: Partial<LogicWorkerBase>) {
    Object.assign(<any>this, a || {});

    this.id = guid();
    this.operation = a?.operation||'';
    this.sudoku = a?.sudoku;
    this.debug = !!a?.debug;
    this.params = a?.params;
  }

  id: string;
  operation: LogicOperation|'';
  sudoku?: Sudoku;
  params?: any;
  debug: boolean;
}

/**
 * dati in ingresso del web-worker
 */
export class LogicWorkerArgs extends LogicWorkerBase {
  constructor(a?: Partial<LogicWorkerArgs>) {
    super(a);
    this.options = a?.options||{};
  }

  timeout?: number;
  options?: ValueOptions;
}

/**
 * dati in uscita dal web-worker
 */
export class LogicWorkerData extends LogicWorkerArgs {
  constructor(a?: Partial<LogicWorkerData>) {
    super(a);

    this.allowHidden = !!a?.allowHidden;
    this.isRunning = !!a?.isRunning;
    this.error = getGlobalErrorMessage(this.sudoku)||a?.error||'';
    this.generationStat = a?.generationStat;
  }

  error?: any;
  allowHidden: boolean;
  isRunning?: boolean;
  generationStat?: GenerationStat;
}


export interface LogicExecutor {
  /**
   * esegue una logica
   * @param args
   */
  execute(args: Partial<LogicWorkerArgs>): string;
}
