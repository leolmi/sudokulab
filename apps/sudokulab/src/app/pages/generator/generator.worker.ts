import {
  DEFAULT_MESSAGES,
  GeneratorAction,
  GeneratorStatus,
  GeneratorWorkerArgs,
  GeneratorWorkerData,
  getGeneratorStatus,
  MessageType,
  PlaySudoku,
  SDK_DEFAULT_GENERATOR_TIMEOUT,
  SudokuMessage
} from "@sudokulab/model";
import {cloneDeep as _clone} from 'lodash';

interface GeneratorWorkeState {
  timeout: any;
  status: GeneratorStatus;
  sdk: PlaySudoku;
}

const STATE: GeneratorWorkeState = {
  timeout: null,
  status: new GeneratorStatus(),
  sdk: new PlaySudoku()
}

const postStringMessage = (message: string, type = MessageType.warning) => {
  _postMessage({message: new SudokuMessage({message, type})});
}

const startProcess = () => {
  STATE.status.running = true;
  STATE.status.stopping = false;
  postStringMessage('generator started successfully', MessageType.success);
}

const stopProcess = () => {
  STATE.status.running = false;
  STATE.status.stopping = false;
}

const checkState = () => {
  if (STATE.status.stopping && STATE.status.running) {
    STATE.status.running = false;
  }
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
      checkState();
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
    stopProcess();
    _postMessage({ message });
  });
}

//#endregion

const startGenerator = () => {
  startProcess();

  // >>>> TEST
  return _testProcess();
  // <<<< TEST


  // TODO....

}

const _postMessage = (d?: Partial<GeneratorWorkerData>) => {
  postMessage(<GeneratorWorkerData>{ ...d,
    status: STATE.status,
    sdk: STATE.sdk
  });
}

const loadSdk = (sdk: PlaySudoku) => {
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
        if (STATE.status.running) return postStringMessage('Worker is still running');
        if (!sdk) return postStringMessage('Undefined generator schema');
        loadSdk(sdk);
        startGenerator();
        break;
      case GeneratorAction.stop:
        if (!STATE.status.running) return postStringMessage('Worker is not running');
        if (STATE.status.stopping) return postStringMessage('Worker is still stopping');
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
