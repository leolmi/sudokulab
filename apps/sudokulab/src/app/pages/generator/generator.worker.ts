import {
  DEFAULT_MESSAGES,
  SudokuEndGenerationMode,
  GeneratorAction,
  GeneratorMode,
  GeneratorStatus,
  GeneratorWorkerArgs,
  GeneratorWorkerData,
  getGeneratorStatus,
  getPlayFixedValues, getSudoku,
  MessageType,
  PlaySudoku,
  SDK_DEFAULT_GENERATOR_TIMEOUT,
  Solver,
  SudokuMessage
} from "@sudokulab/model";
import {cloneDeep as _clone, extend as _extend, keys as _keys} from 'lodash';
import {buildValMap, nextValMap} from "./valorizations-map.builder";
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
  start: 0,
}

const _postStringMessage = (message: string, type = MessageType.warning) => {
  _postMessage({message: new SudokuMessage({message, type})});
}

const _clearState = () => {
  STATE.status.stopping = false;
  STATE.cache = {};
  STATE.schemaCache = {};
  STATE.noSchema = false;
  STATE.valMap = undefined;
  STATE.activeSdk = undefined;
  STATE.start = Date.now();
  STATE.status.generatedSchemas = [];
  STATE.status.workingSchema = undefined;
}

const _startProcess = () => {
  STATE.status.running = true;
  _clearState();
  _postStringMessage('generator started successfully', MessageType.success);
}

const _stopProcess = () => {
  STATE.status.running = false;
  STATE.status.stopping = false;
  STATE.status.workingSchema = undefined;
}

const isStopping = () => STATE.status.stopping;

/**
 * verifica lo stato di running/stopping
 */
const _checkRunningState = (): boolean => {
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
      _checkRunningState();
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
    STATE.valMap = buildValMap(STATE.activeSdk, _checkRunningState);
  } else {
    nextValMap(STATE.valMap, STATE.activeSdk, _checkRunningState);
  }
}

/**
 * se può valorizza le celle dinamiche altrimenti restituisce false
 */
const _applyFixedValues = (): boolean => {
  if (STATE.valMap?.isDone) return false;
  const values = STATE.valMap?.valuesForCells||{};
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
    const result = generateSchema(STATE.sdk, {
      cache: STATE.schemaCache,
      check: _checkRunningState
    });
    if (!result?.sdk) return false;
    STATE.activeSdk = result.sdk;
  }
  // lo schema è ancora risolvibile
  return true;
}


const _publishSchema = () => {
  const schema = _clone(STATE.activeSdk?.sudoku);
  if (schema) STATE.status.generatedSchemas?.push(schema);
  _postMessage({
    status: {
      ...STATE.status,
      generatedSchema: schema
    }
  })
}

/**
 * risolve lo schema attivo
 */
const _solve = () => {
  if (!STATE.activeSdk || !_checkRunningState()) return;
  const values = getPlayFixedValues(STATE.activeSdk);
  if (values) STATE.cache[values] = true;
  const solver = new Solver(STATE.activeSdk);
  const result = solver.solve();
  if (result.unique) {
    _extend(STATE.activeSdk, result.unique.sdk);
    _publishSchema();
  }
}

/**
 * attiva lo schema in lavorazione
 */
const _buildActiveSchema = () => {
  STATE.activeSdk = _clone(STATE.sdk);
}

const _checkNextCycle = (): boolean => {
  // verifica lo stop utente
  if (!_checkRunningState()) return false;

  // verifica le impostazioni di stop
  switch(STATE.sdk.options.generator.generationEndMode) {
    case SudokuEndGenerationMode.afterN:
      if ((STATE.status.generatedSchemas?.length||0)>=STATE.sdk.options.generator.generationEndValue) return false;
      break;
    case SudokuEndGenerationMode.afterTime:
      const now = Date.now();
      if ((now - STATE.start) > (STATE.sdk.options.generator.generationEndValue*1000)) return false;
      break;
    case SudokuEndGenerationMode.manual:
    default:
      break;
  }
  // verifica lo stato del generatore
  switch (STATE.status.mode) {
    case GeneratorMode.fixed:
      // valuta se esistono possibili valorizzazioni
      if (STATE.valMap && !STATE.valMap.isDone) return true;
      break;
    case GeneratorMode.multiple:
      // valuta se esistono possibili valorizzazioni
      if (STATE.valMap && !STATE.valMap.isDone) return true;
      // valuta se è possibile creare schemi
      if (!STATE.noSchema) return true;
      break;
  }
  return false;
}

const _notifyWorkingInfo = () => {
  if (STATE.activeSdk) {
    STATE.status.workingSchema = getSudoku(STATE.activeSdk);
    _postMessage();
  }
}

const _checkStartCycle = () => {
  // il setTimeout permette di leggere eventuali messaggi utente
  // inviati durante il processo di generazione
  setTimeout(() => {
    _checkRunningState();
    if (isStopping()) return _checkEnd();
    switch (STATE.status.mode) {
      case GeneratorMode.single:
        _buildActiveSchema();
        _notifyWorkingInfo();
        _solve();
        break;
      case GeneratorMode.fixed:
        _buildActiveSchema();
        _notifyWorkingInfo();
        _checkValMap();
        if (_applyFixedValues()) _solve();
        break;
      case GeneratorMode.multiple:
        if (!_checkSchemas()) return _checkEnd();
        _notifyWorkingInfo();
        _checkValMap();
        if (_applyFixedValues()) _solve();
        break;
    }
    _checkEnd();
  });
}

const _checkEnd = () => {
  if (_checkNextCycle()) {
    _checkStartCycle();
  } else {
    const message = STATE.status.stopping ? DEFAULT_MESSAGES.userEnded : DEFAULT_MESSAGES.ended;
    _stopProcess();
    _postMessage({message});
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
