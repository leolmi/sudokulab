import {
  GeneratorAction,
  GeneratorWorkerArgs,
  GeneratorWorkerData,
  MessageType,
  SDK_DEFAULT_GENERATOR_TIMEOUT,
  SudokuMessage
} from "@sudokulab/model";

let _timeout: any;

const TODO = new SudokuMessage({
  message: 'Not implemented yet',
  type: MessageType.warning
});

/**
 * worker input logic
 */
addEventListener('message', ({ data }) => {
  const args = <GeneratorWorkerArgs>data;
  const sdk = args.sdk;
  if (!sdk) return;
  if (_timeout) clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    switch (args.action) {


      // TODO: lgica del generatore nel worker


      default:
        postMessage(<GeneratorWorkerData>{ message: TODO });
        break;
    }
  }, args.timeout || SDK_DEFAULT_GENERATOR_TIMEOUT)
});
