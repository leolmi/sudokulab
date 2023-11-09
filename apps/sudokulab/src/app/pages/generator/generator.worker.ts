import {
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

const TODO = new SudokuMessage({
  message: 'Not implemented yet',
  type: MessageType.warning
});

const STATE: GeneratorWorkeState = {
  timeout: null,
  status: new GeneratorStatus(),
  sdk: new PlaySudoku()
}

const postStringMessage = (message: string, type = MessageType.warning) => {
  _postMessage({message: new SudokuMessage({message, type})});
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

/**
 *
 * @param onend    (end callback)
 * @param duration (secondi)
 * @param i
 */
const runPart = (onend: () => void, duration = 10, i = 0) => {
  setTimeout(() => {
    if (i < (duration * 2)) {
      checkState();
      if (STATE.status.running) {
        runPart(onend, duration, ++i);
      } else {
        onend();
      }
    } else {
      onend();
    }
  }, 500);
}

const testRUN = () => {
  STATE.status.running = true;
  STATE.status.stopping = false;

  postStringMessage('generator started successfully', MessageType.success);

  runPart(() => {
    const message = new SudokuMessage({
      message: STATE.status.stopping ? 'worker is stopped' : 'finish generation!',
      type: STATE.status.stopping ? MessageType.warning : MessageType.success
    });
    stopProcess();
    _postMessage({ message });
  });
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
        if (!args.sdk) return postStringMessage('Undefined generator schema');
        loadSdk(args.sdk);
        testRUN();
        break;
      case GeneratorAction.stop:
        if (!STATE.status.running) return postStringMessage('Worker is not running');
        if (STATE.status.stopping) return postStringMessage('Worker is still stopping');
        STATE.status.stopping = true;
        _postMessage();
        break;
      case GeneratorAction.generate:
      default:
        _postMessage({ message: TODO });
        break;
    }
  }, args.timeout || SDK_DEFAULT_GENERATOR_TIMEOUT)
});
