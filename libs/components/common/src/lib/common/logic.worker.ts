import {
  checkStatus,
  LogicOperation,
  LogicWorkerData,
  SolveMode,
  SolveOptions,
  SolveWork,
  Sudoku,
  SudokuEx
} from '@olmi/model';
import { get as _get } from 'lodash';
import { distinctUntilChanged, filter } from 'rxjs';
import {
  clearSchema,
  generateSchema,
  GeneratorContext,
  getGenerationStat,
  getSolutionByStat,
  getWorkStat,
  solve,
  startGeneration
} from '@olmi/logic';

const DEFAULT_TIMEOUT = 250;
let _timeout: any;
const generationContext: GeneratorContext = new GeneratorContext();


const operationToMode = (op?: LogicOperation|''): SolveMode => {
  switch (op) {
    case 'help':
    case 'solve-step': return 'one-step';
    case 'solve-to': return 'to-step';
    case 'solve-to-try': return 'to-try';
    default: return 'all';
  }
}

const execute = (args: LogicWorkerData) => {
  switch (args?.operation) {
    case 'solve':
    case 'solve-step':
    case 'solve-to':
    case 'solve-to-try':
    case 'help': {
      const options = getSolveOptions(args);
      const res = solve(args.sudoku, options);
      onResult(res, (sdk, error) => {
        args.sudoku = sdk;
        args.error = args.error || error;
        args.allowHidden = options.allowHidden;
      });
      break;
    }
    case 'stop': {
      // do nothing so it cleared the timeout and aborted the previous request
      if (generationContext.session.time) generationContext.session.stopped = true;
      break;
    }
    case 'skip':
      if (generationContext.session.time) generationContext.session.skipSchema = true;
      break;
    case 'clear':
      clearSchema((<SudokuEx>args.sudoku)?.cells, args.options);
      break;
    case 'generate':
      startGeneration(generationContext, args);
      break;
    case 'build': {
      const sdk = generateSchema(generationContext, args);
      if (sdk) args.sudoku = sdk;
      break;
    }
    case 'check':
    default:
      checkStatus((<SudokuEx>args.sudoku)?.cells, {
        ...args.options,
        resetBefore: true
      });
      break;
  }
}

const getSolveOptions = (args?: LogicWorkerData): SolveOptions => {
  const mode = operationToMode(args?.operation);
  return <SolveOptions>{
    mode,
    debug: !!args?.debug,
    allowHidden: args?.operation === 'help',
    toStep: _get(args?.params, 'step')
  };
}

const onResult = (work: SolveWork, handler: (sdk: Sudoku|undefined, error: string|undefined) => void) => {
  const stat = getWorkStat(work);
  const sdk = getSolutionByStat(stat);
  handler(sdk, stat.error);
}

const sendResults = (args?: Partial<LogicWorkerData>) => {
  const output = new LogicWorkerData(args);
  output.isRunning = !!generationContext.session.time;
  postMessage(output);
}

const sendGenerationResults = (operation: LogicOperation) => {
  sendResults({
    operation,
    generationStat: getGenerationStat(generationContext)
  });
}

/**
 * worker input logic
 */
addEventListener('message', ({ data }) => {
  const args = new LogicWorkerData(data);
  if (!args?.operation) return;

  if (_timeout) clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    execute(args);
    _timeout = null;
    sendResults(args);
  }, args?.timeout||DEFAULT_TIMEOUT);
});

// la produzione di uno schema genera una riposta che
// contiene lo schema generato
generationContext.schema$.pipe(
  filter(s => !!s && !!generationContext.session.time),
  distinctUntilChanged((s1: Sudoku|undefined, s2: Sudoku|undefined) => s1?.values === s2?.values))
  .subscribe(() => sendGenerationResults('generation-result'));

// il ping serve a determinare lo stato del generatore
generationContext.ping$.subscribe(() => sendGenerationResults('generation-ping'));

