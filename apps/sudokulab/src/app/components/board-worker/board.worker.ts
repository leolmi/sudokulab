/// <reference lib="webworker" />
import {BoardWorkerArgs, BoardWorkerData} from "./board-worker.model";
import {BoardAction, MessageType, SudokuMessage} from "@sudokulab/model";
import {checkSchema, clearSchema, setCellValue, solveSchema, solveSchemaStep, togglePencil} from "./board-worker.logic";

const SDK_DEFAULT_TIMEOUT = 250;

let _timeout: any;

const TODO = new SudokuMessage({
  message: 'Not implemented yet',
  type: MessageType.warning
});

/**
 * worker input logic
 */
addEventListener('message', ({ data }) => {
  const args = <BoardWorkerArgs>data;
  const sdk = args.sdk;
  if (!sdk) return;
  if (_timeout) clearTimeout(_timeout);
  _timeout = setTimeout(() => {
    switch (args.action || BoardAction.check) {
      case BoardAction.solve:
        const message = solveSchema(sdk);
        if (message) postMessage(<BoardWorkerData>{sdk, message});
        break;
      case BoardAction.clear:
        if (clearSchema(sdk)) postMessage(<BoardWorkerData>{sdk});
        break;
      case BoardAction.solveStep:
        // TODO: risolve lo step successivo
        const highligths = solveSchemaStep(sdk);
        if (highligths) postMessage(<BoardWorkerData>{sdk, highligths});
        postMessage(<BoardWorkerData>{message: TODO});
        break;
      case BoardAction.infoStep:
        // TODO: fornisce le info per lo step successivo
        postMessage(<BoardWorkerData>{message: TODO});
        break;
      case BoardAction.pencil:
        if (togglePencil(sdk)) postMessage(<BoardWorkerData>{sdk});
        break;
      case BoardAction.value:
        if (setCellValue(sdk, args?.cellId || '', args?.value || '')) {
          if (checkSchema(sdk)) postMessage(<BoardWorkerData>{sdk});
        }
        break;
      case BoardAction.check:
      default:
        if (checkSchema(sdk)) postMessage(<BoardWorkerData>{sdk});
        break;
    }
  }, args.timeout || SDK_DEFAULT_TIMEOUT);
});
