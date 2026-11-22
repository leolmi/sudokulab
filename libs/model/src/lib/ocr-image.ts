import { Pos, Quad } from './pos';

/**
 * Elaborazione immagini per l'OCR client-side (pura, senza DOM: usabile in
 * browser, Web Worker e Node).
 *
 * Pipeline: RGBA → grigio → raddrizzamento prospettico del quadrilatero dello
 * schema → riduzione a 288x288 (9 celle da 32px) → 81 tensori normalizzati
 * pronti per il classificatore delle cifre.
 *
 * La normalizzazione di cella (`normalizeOcrCell`) DEVE restare identica a
 * `synth.normalize` in tools/ocr-train/synth.py.
 */

/** lato (px) di una cella in input al classificatore */
export const OCR_CELL_SIZE = 32;
/** lato (px) della griglia raddrizzata */
export const OCR_GRID_SIZE = OCR_CELL_SIZE * 9;
/** lato massimo del warp intermedio (prima della media d'area) */
const OCR_WARP_MAX = OCR_GRID_SIZE * 4;
/** escursione minima inchiostro/sfondo (evita di amplificare il rumore delle celle vuote) */
const OCR_MIN_RANGE = 0.25;

/** immagine in scala di grigi, valori [0..1] (1 = bianco) */
export interface GrayImage {
  width: number;
  height: number;
  data: Float32Array;
}

/** RGBA (es. ImageData.data) → scala di grigi */
export const rgbaToGray = (rgba: ArrayLike<number>, width: number, height: number): GrayImage => {
  const data = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i++, p += 4) {
    data[i] = (0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]) / 255;
  }
  return { width, height, data };
};

/**
 * Omografia 3x3 (row-major, h33 = 1) che porta i 4 punti `src` nei 4 punti `dst`.
 * Risolve il sistema lineare 8x8 con eliminazione di Gauss.
 */
export const computeHomography = (src: Pos[], dst: Pos[]): number[] => {
  const a: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  const n = 8;
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[piv][c])) piv = r;
    [a[c], a[piv]] = [a[piv], a[c]];
    const d = a[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = a[r][c] / d;
      if (!f) continue;
      for (let k = c; k <= n; k++) a[r][k] -= f * a[c][k];
    }
  }
  const h = a.map((row, i) => row[n] / row[i]);
  return [...h, 1];
};

const quadPoints = (q: Quad): Pos[] => [q.tl, q.tr, q.br, q.bl];

const dist = (a: Pos, b: Pos) => Math.hypot(a.x - b.x, a.y - b.y);

/** media d'area (equivalente a PIL Image.BOX) */
export const areaResize = (img: GrayImage, width: number, height: number): GrayImage => {
  const out = new Float32Array(width * height);
  const sx = img.width / width;
  const sy = img.height / height;
  for (let oy = 0; oy < height; oy++) {
    const y0 = oy * sy, y1 = y0 + sy;
    for (let ox = 0; ox < width; ox++) {
      const x0 = ox * sx, x1 = x0 + sx;
      let sum = 0, wsum = 0;
      const ye = Math.min(Math.ceil(y1), img.height);
      const xe = Math.min(Math.ceil(x1), img.width);
      for (let y = Math.floor(y0); y < ye; y++) {
        const wy = Math.min(y + 1, y1) - Math.max(y, y0);
        const row = y * img.width;
        for (let x = Math.floor(x0); x < xe; x++) {
          const w = wy * (Math.min(x + 1, x1) - Math.max(x, x0));
          sum += img.data[row + x] * w;
          wsum += w;
        }
      }
      out[oy * width + ox] = wsum > 0 ? sum / wsum : 1;
    }
  }
  return { width, height, data: out };
};

/**
 * Raddrizza il quadrilatero `quad` dell'immagine in un quadrato di lato `size`.
 * Il warp avviene a una risoluzione vicina a quella nativa del quadrilatero
 * (campionamento bilineare) e poi viene ridotto con media d'area, per evitare
 * aliasing sulle foto ad alta risoluzione.
 */
export const warpQuad = (img: GrayImage, quad: Quad, size = OCR_GRID_SIZE): GrayImage => {
  const pts = quadPoints(quad);
  const native = Math.max(dist(pts[0], pts[1]), dist(pts[1], pts[2]), dist(pts[2], pts[3]), dist(pts[3], pts[0]));
  const ws = Math.max(size, Math.min(OCR_WARP_MAX, Math.round(native)));
  // omografia inversa: destinazione → sorgente
  const dst: Pos[] = [{ x: 0, y: 0 }, { x: ws, y: 0 }, { x: ws, y: ws }, { x: 0, y: ws }];
  const h = computeHomography(dst, pts);
  const out = new Float32Array(ws * ws);
  const { width: W, height: H, data } = img;
  for (let y = 0; y < ws; y++) {
    const py = y + 0.5;
    for (let x = 0; x < ws; x++) {
      const px = x + 0.5;
      const z = h[6] * px + h[7] * py + h[8];
      const sx = (h[0] * px + h[1] * py + h[2]) / z - 0.5;
      const sy = (h[3] * px + h[4] * py + h[5]) / z - 0.5;
      const x0 = Math.floor(sx), y0 = Math.floor(sy);
      if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) {
        out[y * ws + x] = 1;
        continue;
      }
      const fx = sx - x0, fy = sy - y0;
      const i = y0 * W + x0;
      out[y * ws + x] =
        data[i] * (1 - fx) * (1 - fy) +
        data[i + 1] * fx * (1 - fy) +
        data[i + W] * (1 - fx) * fy +
        data[i + W + 1] * fx * fy;
    }
  }
  const warped: GrayImage = { width: ws, height: ws, data: out };
  return ws === size ? warped : areaResize(warped, size, size);
};

/** normalizzazione di una cella 32x32: grigio → inchiostro [0..1] relativo allo sfondo */
export const normalizeOcrCell = (gray: Float32Array): Float32Array => {
  const n = gray.length;
  const ink = new Float32Array(n);
  let max = 0;
  for (let i = 0; i < n; i++) {
    ink[i] = 1 - gray[i];
    if (ink[i] > max) max = ink[i];
  }
  const sorted = Float32Array.from(ink).sort();
  // mediana come numpy.median (media dei due centrali per n pari)
  const bg = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const range = Math.max(max - bg, OCR_MIN_RANGE);
  for (let i = 0; i < n; i++) ink[i] = Math.min(1, Math.max(0, (ink[i] - bg) / range));
  return ink;
};

/**
 * Divide la griglia raddrizzata (OCR_GRID_SIZE²) nelle 81 celle e restituisce
 * il tensore [81, 1, 32, 32] normalizzato per il classificatore.
 */
export const gridToOcrTensor = (grid: GrayImage): Float32Array => {
  const g = grid.width === OCR_GRID_SIZE && grid.height === OCR_GRID_SIZE
    ? grid
    : areaResize(grid, OCR_GRID_SIZE, OCR_GRID_SIZE);
  const cs = OCR_CELL_SIZE;
  const out = new Float32Array(81 * cs * cs);
  const cell = new Float32Array(cs * cs);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      for (let y = 0; y < cs; y++) {
        const row = (r * cs + y) * OCR_GRID_SIZE + c * cs;
        cell.set(g.data.subarray(row, row + cs), y * cs);
      }
      out.set(normalizeOcrCell(cell), (r * 9 + c) * cs * cs);
    }
  }
  return out;
};

/** esito del riconoscimento di una cella */
export interface OcrCellPrediction {
  /** 0 = vuota, 1..9 = cifra */
  value: number;
  /** probabilità della classe scelta */
  confidence: number;
  /** probabilità di tutte le classi (0..9) */
  probs: number[];
}

/** converte l'output [81, 10] del modello in predizioni per cella */
export const decodeOcrPredictions = (probs: ArrayLike<number>): OcrCellPrediction[] => {
  const res: OcrCellPrediction[] = [];
  for (let i = 0; i < 81; i++) {
    const p = Array.from({ length: 10 }, (_, k) => probs[i * 10 + k]);
    let best = 0;
    for (let k = 1; k < 10; k++) if (p[k] > p[best]) best = k;
    res.push({ value: best, confidence: p[best], probs: p });
  }
  return res;
};
