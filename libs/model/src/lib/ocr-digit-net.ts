import { OCR_CELL_SIZE } from './ocr-image';

/**
 * Runtime TypeScript del classificatore di cifre (nessuna dipendenza esterna).
 *
 * Replica esattamente `DigitNet` di tools/ocr-train/train.py:
 *   conv3x3(1→16)+ReLU → maxpool2 → conv3x3(16→32)+ReLU → maxpool2 →
 *   conv3x3(32→64)+ReLU → maxpool2 → fc(1024→64)+ReLU → fc(64→10) → softmax
 * (BatchNorm già fuso nei pesi delle convoluzioni in fase di export).
 *
 * Pesi: file binario generato da train.py (`export_bin`).
 */

const MAGIC = 0x444b4453; // 'SDKD'

interface Tensor {
  dims: number[];
  data: Float32Array;
}

/** legge il file dei pesi */
const parseWeights = (buffer: ArrayBuffer): Tensor[] => {
  const view = new DataView(buffer);
  let o = 0;
  const u32 = () => { const v = view.getUint32(o, true); o += 4; return v; };
  if (u32() !== MAGIC) throw new Error('ocr digit-net: invalid weights file');
  const version = u32();
  if (version !== 1) throw new Error(`ocr digit-net: unsupported version ${version}`);
  const count = u32();
  const tensors: Tensor[] = [];
  for (let t = 0; t < count; t++) {
    const ndim = u32();
    const dims = Array.from({ length: ndim }, u32);
    const len = dims.reduce((a, b) => a * b, 1);
    const data = new Float32Array(len);
    for (let i = 0; i < len; i++, o += 4) data[i] = view.getFloat32(o, true);
    tensors.push({ dims, data });
  }
  return tensors;
};

/** conv 3x3, padding 1, stride 1 + bias + ReLU. input [ci,h,w] → [co,h,w] */
const conv3x3Relu = (input: Float32Array, ci: number, h: number, w: number, k: Tensor, b: Tensor): Float32Array => {
  const co = k.dims[0];
  const out = new Float32Array(co * h * w);
  const kw = k.data;
  for (let o = 0; o < co; o++) {
    const plane = out.subarray(o * h * w, (o + 1) * h * w);
    plane.fill(b.data[o]);
    for (let i = 0; i < ci; i++) {
      const src = i * h * w;
      const kb = (o * ci + i) * 9;
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const wv = kw[kb + ky * 3 + kx];
          if (wv === 0) continue;
          const dy = ky - 1, dx = kx - 1;
          const y0 = Math.max(0, -dy), y1 = Math.min(h, h - dy);
          const x0 = Math.max(0, -dx), x1 = Math.min(w, w - dx);
          for (let y = y0; y < y1; y++) {
            const pr = y * w;
            const sr = src + (y + dy) * w + dx;
            for (let x = x0; x < x1; x++) plane[pr + x] += wv * input[sr + x];
          }
        }
      }
    }
    for (let j = 0; j < plane.length; j++) if (plane[j] < 0) plane[j] = 0;
  }
  return out;
};

/** maxpool 2x2 stride 2. [c,h,w] → [c,h/2,w/2] */
const maxPool2 = (input: Float32Array, c: number, h: number, w: number): Float32Array => {
  const oh = h >> 1, ow = w >> 1;
  const out = new Float32Array(c * oh * ow);
  for (let ch = 0; ch < c; ch++) {
    const s = ch * h * w, d = ch * oh * ow;
    for (let y = 0; y < oh; y++) {
      const r0 = s + 2 * y * w, r1 = r0 + w;
      for (let x = 0; x < ow; x++) {
        const a = 2 * x;
        out[d + y * ow + x] = Math.max(input[r0 + a], input[r0 + a + 1], input[r1 + a], input[r1 + a + 1]);
      }
    }
  }
  return out;
};

/** fully connected: W [o,i] · x + b */
const linear = (x: Float32Array, wt: Tensor, b: Tensor, relu: boolean): Float32Array => {
  const [no, ni] = wt.dims;
  const out = new Float32Array(no);
  for (let o = 0; o < no; o++) {
    let s = b.data[o];
    const r = o * ni;
    for (let i = 0; i < ni; i++) s += wt.data[r + i] * x[i];
    out[o] = relu && s < 0 ? 0 : s;
  }
  return out;
};

const softmax = (x: Float32Array): Float32Array => {
  let m = -Infinity;
  for (const v of x) if (v > m) m = v;
  let sum = 0;
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) sum += (out[i] = Math.exp(x[i] - m));
  for (let i = 0; i < x.length; i++) out[i] /= sum;
  return out;
};

export class OcrDigitNet {
  private readonly t: Tensor[];

  constructor(weights: ArrayBuffer) {
    this.t = parseWeights(weights);
    if (this.t.length !== 10) throw new Error('ocr digit-net: unexpected tensor count');
  }

  /** classifica una cella normalizzata [32*32] → probabilità [10] */
  predictCell(cell: Float32Array): Float32Array {
    const [c1w, c1b, c2w, c2b, c3w, c3b, f1w, f1b, f2w, f2b] = this.t;
    let s = OCR_CELL_SIZE;
    let x = conv3x3Relu(cell, 1, s, s, c1w, c1b);
    x = maxPool2(x, c1w.dims[0], s, s); s >>= 1;
    x = conv3x3Relu(x, c1w.dims[0], s, s, c2w, c2b);
    x = maxPool2(x, c2w.dims[0], s, s); s >>= 1;
    x = conv3x3Relu(x, c2w.dims[0], s, s, c3w, c3b);
    x = maxPool2(x, c3w.dims[0], s, s);
    x = linear(x, f1w, f1b, true);
    return softmax(linear(x, f2w, f2b, false));
  }

  /** classifica un batch [n*32*32] → probabilità [n*10] */
  predict(batch: Float32Array): Float32Array {
    const cs = OCR_CELL_SIZE * OCR_CELL_SIZE;
    const n = Math.floor(batch.length / cs);
    const out = new Float32Array(n * 10);
    for (let i = 0; i < n; i++) out.set(this.predictCell(batch.subarray(i * cs, (i + 1) * cs)), i * 10);
    return out;
  }
}
