import {
  DEFAULT_MESSAGES,
  GeneratorAction,
  GeneratorMode,
  GeneratorStatus,
  GeneratorWorkerArgs,
  GeneratorWorkerData,
  getGeneratorStatus,
  getValues,
  MessageType,
  PlaySudoku,
  SDK_DEFAULT_GENERATOR_TIMEOUT,
  Solver,
  SudokuMessage
} from "@sudokulab/model";
import {cloneDeep as _clone, extend as _extend, keys as _keys} from 'lodash';
import {buildValMap} from "./valorizations-map.builder";
import {GeneratorWorkerState} from "./generator.model";
import {generateSchema} from "./schema.builder";



const STATE: GeneratorWorkerState = {
  timeout: undefined,
  status: new GeneratorStatus(),
  sdk: new PlaySudoku(),
  activeSdk: undefined,
  cache: {},
  valMap: undefined,
  schemaCache: {},
  noSchema: false,
}

const _postStringMessage = (message: string, type = MessageType.warning) => {
  _postMessage({message: new SudokuMessage({message, type})});
}

const _clearState = () => {
  STATE.status.stopping = false;
  STATE.status.generated = 0;
  STATE.cache = {};
  STATE.schemaCache = {};
  STATE.noSchema = false;
  STATE.valMap = undefined;
  STATE.activeSdk = undefined;
}

const _startProcess = () => {
  STATE.status.running = true;
  _clearState();
  _postStringMessage('generator started successfully', MessageType.success);
}

const _stopProcess = () => {
  STATE.status.running = false;
  STATE.status.stopping = false;
}

const isStopping = () => STATE.status.stopping;

const _checkState = (): boolean => {
  if (STATE.status.stopping && STATE.status.running) {
    STATE.status.running = false;
  }
  return !!STATE.status.running;
}

//#region: TEST

/**
 *
 * @param onend    (end callback)
 * @param duration (secondi)
 * @param i
 */
const _testProcessStep = (onend: () => void, duration = 10, i = 0) => {
  setTimeout(() => {
    if (i < (duration * 2)) {
      _checkState();
      if (STATE.status.running) {
        _testProcessStep(onend, duration, ++i);
      } else {
        onend();
      }
    } else {
      onend();
    }
  }, 500);
}

const _testProcess = () => {

  _testProcessStep(() => {
    const message = new SudokuMessage({
      message: STATE.status.stopping ? 'worker is stopped' : 'finish generation!',
      type: STATE.status.stopping ? MessageType.warning : MessageType.success
    });
    _stopProcess();
    _postMessage({ message });
  });
}

//#endregion

/**
 * verifica che sia stata creata la mappa di valorizzazioni
 */
const _checkValMap = () => {
  if (!STATE.valMap) {
    const start = performance.now();
    STATE.valMap = buildValMap(_checkState, STATE.activeSdk);
    console.log(`valorization map builded after ${(performance.now()-start).toFixed(0)} mls, with ${(STATE.valMap?.valuesForCells||[]).length} steps`);
  }
}

/**
 * se può valorizza le celle dinamiche altrimenti restituisce false
 */
const _applyFixedValues = (): boolean => {
  if (!STATE.valMap?.isComplete || STATE.valMap.isDone) return false;
  const values = STATE.valMap.valuesForCells[STATE.valMap.cycle];
  _keys(values).forEach(cid => {
    const cell = (STATE.activeSdk?.cells||{})[cid];
    if (cell) {
      cell.value = values[cid];
      cell.fixed = true;
    }
  })
  return true;
}

/**
 * verifica la costruzione di un nuovo schema
 */
const _checkSchemas = (): boolean => {
  // se lo schema corrente deve ancora integrare le celle generate
  // oppure si sono esaurite le possibili valorizzazioni
  // allora si genera un nuovo schema
  if (!STATE.activeSdk || STATE.valMap?.isDone) {
    STATE.valMap = undefined;
    // se non ci sono più schemi generabili esce > FALSE
    const result = generateSchema(STATE.sdk, { cache: STATE.schemaCache });
    if (!result?.sdk) return false;
    STATE.activeSdk = result.sdk;
  }
  // lo schema è ancora risolvibile
  return true;
}


const _publishSchema = () => {
  STATE.status.generated++;
  _postMessage({
    status: {
      ...STATE.status,
      generatedSchema: _clone(STATE.activeSdk?.sudoku)
    }
  })
}

/**
 * risolve lo schema attivo
 */
const _solve = () => {
  if (!STATE.activeSdk) return;
  const solver = new Solver(STATE.activeSdk);
  const result = solver.solve();
  if (result.unique) {
    _extend(STATE.activeSdk, result.unique.sdk);
    _publishSchema();
  } else {
    const values = getValues(STATE.activeSdk);
    STATE.cache[values] = true;
  }
}

/**
 * attiva lo schema in lavorazione
 */
const _buildActiveSchema = () => {
  STATE.activeSdk = _clone(STATE.sdk);
}

const _checkNextCycle = (): boolean => {
  switch (STATE.status.mode) {
    case GeneratorMode.fixed:
      // valuta se esistono possibili valorizzazioni
      if (STATE.valMap && !STATE.valMap.isDone) {
        STATE.valMap.cycle++;
        return true;
      }
      break;
    case GeneratorMode.multiple:
      // valuta se esistono possibili valorizzazioni
      if (STATE.valMap && !STATE.valMap.isDone) {
        STATE.valMap.cycle++;
        return true;
      }
      // valuta se è possibile creare schemi
      if (!STATE.noSchema) return true;
      break;
  }
  return false;
}

const _checkStartCycle = () => {
  _checkState();
  if (isStopping()) return _checkEnd();
  switch (STATE.status.mode) {
    case GeneratorMode.single:
      _buildActiveSchema();
      _solve();
      break;
    case GeneratorMode.fixed:
      _buildActiveSchema();
      _checkValMap();
      if (_applyFixedValues()) _solve();
      break;
    case GeneratorMode.multiple:
      if (!_checkSchemas()) return _checkEnd();
      _checkValMap();
      if (_applyFixedValues()) _solve();
      break;
  }
  _checkEnd();
}

const _checkEnd = () => {
  if (_checkNextCycle()) {
    _checkStartCycle();
  } else {
    _stopProcess();
    _postMessage({message: DEFAULT_MESSAGES.ended});
  }
}

const _startGenerator = () => {
  _startProcess();

  // >>>> TEST
  // return _testProcess();
  // <<<< TEST

  _checkStartCycle();
}

const _postMessage = (d?: Partial<GeneratorWorkerData>) => {
  postMessage(<GeneratorWorkerData>{ ...d,
    status: STATE.status,
    sdk: STATE.sdk
  });
}

const _loadSdk = (sdk: PlaySudoku) => {
  STATE.sdk = _clone(sdk);
  const status = getGeneratorStatus(sdk);
  STATE.status = new GeneratorStatus({
    fixed: status.fixed,
    dynamics: status.dynamics,
    mode: status.mode
  });
}

/**
 * worker input logic
 */
addEventListener('message', ({ data }) => {
  const args = <GeneratorWorkerArgs>data;
  const sdk = args.sdk;
  if (!sdk) return;
  if (STATE.timeout) clearTimeout(STATE.timeout);
  STATE.timeout = setTimeout(() => {
    switch (args.action) {
      case GeneratorAction.run:
        if (STATE.status.running) return _postStringMessage('Worker is still running');
        if (!sdk) return _postStringMessage('Undefined generator schema');
        _loadSdk(sdk);
        _startGenerator();
        break;
      case GeneratorAction.stop:
        if (!STATE.status.running) return _postStringMessage('Worker is not running');
        if (STATE.status.stopping) return _postStringMessage('Worker is still stopping');
        STATE.status.stopping = true;
        _postMessage();
        break;
      case GeneratorAction.generate:
      default:
        _postMessage({ message: DEFAULT_MESSAGES.todo });
        break;
    }
  }, args.timeout || SDK_DEFAULT_GENERATOR_TIMEOUT)
});
