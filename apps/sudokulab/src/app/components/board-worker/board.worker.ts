/// <reference lib="webworker" />
import {BoardAction, BoardWorkerArgs, BoardWorkerData, MessageType, SudokuMessage} from "@sudokulab/model";
import {
  calcInfoStep,
  checkSchema,
  clearSchema,
  getLineHighlights,
  setCellValue,
  solveSchema,
  solveSchemaStep,
  toggleAvalable,
  togglePencil
} from "./board-worker.logic";

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
        const hls = solveSchemaStep(sdk);
        if (hls) postMessage(<BoardWorkerData>{sdk, highlights: hls});
        break;
      case BoardAction.calcStep:
        const dat = calcInfoStep(sdk);
        if (dat) postMessage(dat);
        break;
      case BoardAction.infoLine:
        const hll = getLineHighlights(args?.info);
        postMessage(<BoardWorkerData>{highlights: hll});
        break;
      case BoardAction.pencil:
        if (togglePencil(sdk)) postMessage(<BoardWorkerData>{sdk});
        break;
      case BoardAction.available:
        if (toggleAvalable(sdk)) postMessage(<BoardWorkerData>{sdk});
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
