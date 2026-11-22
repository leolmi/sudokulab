import * as fs from 'fs';
import * as path from 'path';
import { Jimp } from 'jimp';
import {
  decodeOcrPredictions,
  GrayImage,
  gridToOcrTensor,
  OCR_CELL_SIZE,
  OCR_GRID_SIZE,
  OcrCellPrediction,
  OcrDigitNet,
  rgbaToGray,
  warpQuad,
} from '@olmi/model';
import { detectGridQuad, fullImageQuad } from './ocr.grid-detect';
import { OcrDoubt, OcrResult } from '../../model/ocr.result';

/** sotto questa confidenza la cella viene segnalata come dubbia */
export const OCR_DOUBT_CONFIDENCE = 0.8;

/** percorsi in cui cercare i pesi del classificatore (build e sorgenti) */
const WEIGHTS_PATHS = [
  path.join(__dirname, 'assets/ocr/digits.bin'),
  path.resolve(process.cwd(), 'apps/sudoku/public/ocr/digits.bin'),
];

let _net: OcrDigitNet | null = null;

const getNet = (): OcrDigitNet => {
  if (_net) return _net;
  const file = WEIGHTS_PATHS.find(p => fs.existsSync(p));
  if (!file) throw new Error(`ocr: weights not found (${WEIGHTS_PATHS.join(', ')})`);
  const b = fs.readFileSync(file);
  _net = new OcrDigitNet(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer);
  return _net;
};

export interface OcrScanTimes {
  decode: number;
  detect: number;
  warp: number;
  net: number;
}

export interface OcrScanOutput {
  result: OcrResult;
  predictions: OcrCellPrediction[];
  gridFound: boolean;
  times: OcrScanTimes;
}

/**
 * Riconoscimento schema da immagine:
 * 1. rilevamento quadrilatero griglia (OpenCV)
 * 2. raddrizzamento prospettico + 81 celle normalizzate (@olmi/model)
 * 3. classificazione cifre con la CNN (@olmi/model, OcrDigitNet)
 */
export const scanImage = async (raw: Buffer): Promise<OcrScanOutput> => {
  const net = getNet();

  let t = performance.now();
  const img = await Jimp.read(raw);
  const { width, height } = img.bitmap;
  const rgba = new Uint8Array(img.bitmap.data.buffer, img.bitmap.data.byteOffset, img.bitmap.data.byteLength);
  const decode = performance.now() - t;

  t = performance.now();
  const quad = detectGridQuad(rgba, width, height);
  const detect = performance.now() - t;

  t = performance.now();
  const grid = warpQuad(rgbaToGray(rgba, width, height), quad || fullImageQuad(width, height));
  const tensor = gridToOcrTensor(grid);
  const warp = performance.now() - t;

  t = performance.now();
  const predictions = decodeOcrPredictions(net.predict(tensor));
  const netTime = performance.now() - t;

  const values = predictions.map(p => `${p.value}`).join('');
  const doubts: OcrDoubt[] = [];
  for (let i = 0; i < 81; i++) {
    const p = predictions[i];
    if (p.confidence >= OCR_DOUBT_CONFIDENCE) continue;
    doubts.push(new OcrDoubt({
      cell: { x: i % 9, y: Math.floor(i / 9) },
      image: await cellDataUrl(grid, i),
      map: candidates(p),
    }));
  }

  return {
    result: new OcrResult({ values, doubts }),
    predictions,
    gridFound: !!quad,
    times: { decode, detect, warp, net: netTime },
  };
};

/** candidati più probabili, es. "5:62,6:30" (valore:percentuale) */
const candidates = (p: OcrCellPrediction): string =>
  p.probs
    .map((v, k) => ({ k, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .filter(c => c.v >= 0.05)
    .map(c => `${c.k}:${Math.round(c.v * 100)}`)
    .join(',');

/** immagine (data url png) della cella i-esima della griglia raddrizzata */
const cellDataUrl = async (grid: GrayImage, index: number): Promise<string> => {
  const cs = OCR_CELL_SIZE;
  const r = Math.floor(index / 9), c = index % 9;
  const img = new Jimp({ width: cs, height: cs });
  for (let y = 0; y < cs; y++) {
    for (let x = 0; x < cs; x++) {
      const g = Math.round(grid.data[(r * cs + y) * OCR_GRID_SIZE + c * cs + x] * 255) & 0xff;
      img.setPixelColor(((g << 24) | (g << 16) | (g << 8) | 0xff) >>> 0, x, y);
    }
  }
  return img.getBase64('image/png');
};
