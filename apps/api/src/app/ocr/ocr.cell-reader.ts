import { Jimp } from 'jimp';
import { cv } from 'opencv-wasm';
import { OcrContext } from '../../model/ocr.model';
import { CONTOUR_TEMPLATES, NPoint, ContourTemplate } from './ocr.contour-templates';

const DARK_THRESHOLD = 128;              // sotto = pixel "inchiostro"
const MIN_PIXEL_COUNT = 15;              // minimo pixel scuri per considerare la cella piena
const CONTOUR_SAMPLE_POINTS = 32;        // punti campionati lungo il contorno
const ASPECT_RATIO_1_THRESHOLD = 0.45;   // sotto questa soglia → cifra "1"
const MIN_HOLE_AREA_RATIO = 0.05;        // area minima buco (% del contorno esterno)
const CONTOUR_MAX_SHIFT = 4;             // shift rotazionale massimo nel matching
const AR_PENALTY_WEIGHT = 0.3;           // peso penalità aspect ratio

/** Descrittore topologico di una cifra candidata */
interface DigitTopology {
  outerContour: NPoint[];
  holeCount: number;
  aspectRatio: number;
}

// ---------------------------------------------------------------------------
//  Interfaccia log strutturato
// ---------------------------------------------------------------------------

export interface CellMatchScore {
  digit: number;
  distance: number;
}

export interface CellMatchLog {
  row: number;
  col: number;
  darkPixels: number;
  isEmpty: boolean;
  zones: number[];
  scores: CellMatchScore[];
  result: number;
  holeCount?: number;
  aspectRatio?: number;
}

// ---------------------------------------------------------------------------
// Lettura cella
// ---------------------------------------------------------------------------

/**
 * Legge una cella e restituisce il numero riconosciuto (1-9) oppure 0 se vuota.
 * @param index indice posizionale della cella nella griglia
 */
export const readCell = async (
  cellBuffer: Buffer,
  context: OcrContext,
  index = 0
): Promise<number> => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const img = await Jimp.read(cellBuffer);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const pixels = extractDarkPixels(img, context);

  if (pixels.length < MIN_PIXEL_COUNT) {
    const log: CellMatchLog = {
      row, col,
      darkPixels: pixels.length,
      isEmpty: true,
      zones: [],
      scores: [],
      result: 0,
    };
    if (context.debug) console.log(`[ocr] cell-match ${JSON.stringify(log)}`);
    return 0;
  }

  // --- Nuovo pipeline: contorni vettoriali ---
  const size = context.options.imageOptions.cellSize;
  const binaryMat = pixelsToBinaryMat(pixels, size);
  const topology = extractTopology(binaryMat, size);
  binaryMat.delete();

  if (!topology) {
    const log: CellMatchLog = {
      row, col,
      darkPixels: pixels.length,
      isEmpty: false,
      zones: [],
      scores: [],
      result: 0,
    };
    if (context.debug) console.log(`[ocr] cell-match ${JSON.stringify(log)}`);
    return 0;
  }

  const { digit, scores } = matchContour(topology);

  const log: CellMatchLog = {
    row, col,
    darkPixels: pixels.length,
    isEmpty: false,
    zones: [],
    scores,
    result: digit,
    holeCount: topology.holeCount,
    aspectRatio: +topology.aspectRatio.toFixed(4),
  };
  if (context.debug) console.log(`[ocr] cell-match ${JSON.stringify(log)}`);

  return digit;
};

// ---------------------------------------------------------------------------
//  Estrazione pixel del numero (flood-fill per escludere i bordi cella)
// ---------------------------------------------------------------------------

interface Pixel { x: number; y: number }

/**
 * Estrae i pixel scuri che appartengono al numero, escludendo le linee
 * della griglia tramite flood-fill dal perimetro dell'immagine.
 *
 * Logica:
 *  1. Costruisce una mappa di luminanza (dark/light) per ogni pixel.
 *  2. Flood-fill partendo da tutti i pixel scuri sul perimetro dell'immagine:
 *     questi sono per definizione parte del bordo della cella.
 *  3. Tutti i pixel scuri NON raggiunti dal flood-fill sono il numero,
 *     perché separati dai bordi da un percorso chiuso di pixel bianchi.
 */
function extractDarkPixels(
  img: InstanceType<typeof Jimp>,
  context: OcrContext
): Pixel[] {
  const size = context.options.imageOptions.cellSize;

  // 1. Mappa dark/light
  const dark = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      dark[y * size + x] = isDark(img, x, y) ? 1 : 0;
    }
  }

  // 2. Flood-fill dai pixel scuri sul perimetro → marca come "bordo" (valore 2)
  const stack: number[] = [];

  // Raccoglie i seed dal perimetro (righe 0 e max, colonne 0 e max)
  for (let x = 0; x < size; x++) {
    if (dark[x] === 1) stack.push(x);                          // riga 0
    if (dark[(size - 1) * size + x] === 1) stack.push((size - 1) * size + x); // riga max
  }
  for (let y = 1; y < size - 1; y++) {
    if (dark[y * size] === 1) stack.push(y * size);             // colonna 0
    if (dark[y * size + size - 1] === 1) stack.push(y * size + size - 1); // colonna max
  }

  // Marca i seed
  for (const idx of stack) dark[idx] = 2;

  // Flood-fill iterativo (4-connesso)
  while (stack.length > 0) {
    const idx = stack.pop()!;
    const x = idx % size;
    const y = (idx - x) / size;

    const neighbors = [
      y > 0        ? idx - size : -1,  // su
      y < size - 1 ? idx + size : -1,  // giù
      x > 0        ? idx - 1    : -1,  // sinistra
      x < size - 1 ? idx + 1    : -1,  // destra
    ];

    for (const ni of neighbors) {
      if (ni >= 0 && dark[ni] === 1) {
        dark[ni] = 2; // marca come bordo
        stack.push(ni);
      }
    }
  }

  // 3. Raccoglie i pixel scuri non marcati (valore 1) → sono il numero
  const digits: Pixel[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (dark[y * size + x] === 1) {
        digits.push({ x, y });
      }
    }
  }

  return digits;
}

/**
 * Un pixel è "scuro" se la sua luminanza è sotto la soglia.
 */
function isDark(img: InstanceType<typeof Jimp>, x: number, y: number): boolean {
  const color = img.getPixelColor(x, y);
  const r = (color >> 24) & 0xff;
  const g = (color >> 16) & 0xff;
  const b = (color >> 8) & 0xff;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma < DARK_THRESHOLD;
}

// ---------------------------------------------------------------------------
//  Conversione Pixel[] → cv.Mat binaria
// ---------------------------------------------------------------------------

/**
 * Converte l'array di pixel (output di extractDarkPixels) in una cv.Mat binaria.
 * Pixel scuri = 255 (bianco), sfondo = 0 (nero). Formato per findContours.
 */
function pixelsToBinaryMat(pixels: Pixel[], size: number): any {
  const mat = cv.Mat.zeros(size, size, cv.CV_8UC1);
  for (const p of pixels) {
    mat.ucharPtr(p.y, p.x)[0] = 255;
  }
  return mat;
}

// ---------------------------------------------------------------------------
//  Campionamento punti equidistanti lungo un contorno
// ---------------------------------------------------------------------------

/**
 * Estrae tutti i punti da un contorno OpenCV in un array JS.
 */
function contourToPoints(contour: any): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < contour.rows; i++) {
    const ptr = contour.intPtr(i, 0);
    pts.push({ x: ptr[0], y: ptr[1] });
  }
  return pts;
}

/**
 * Campiona n punti equidistanti lungo un contorno chiuso.
 * Il punto di partenza è il punto più in alto (min Y), a parità il più a sinistra.
 * Le coordinate sono normalizzate a [0,1] rispetto al bounding box.
 */
function sampleContourPoints(
  rawPoints: { x: number; y: number }[],
  n: number,
  bbox: { x: number; y: number; width: number; height: number }
): NPoint[] {
  if (rawPoints.length < 2) return [];

  // Ruota l'array in modo che parta dal punto più in alto-sx
  let startIdx = 0;
  let minY = Infinity, minX = Infinity;
  for (let i = 0; i < rawPoints.length; i++) {
    const p = rawPoints[i];
    if (p.y < minY || (p.y === minY && p.x < minX)) {
      minY = p.y;
      minX = p.x;
      startIdx = i;
    }
  }
  const pts = [...rawPoints.slice(startIdx), ...rawPoints.slice(0, startIdx)];

  // Calcola lunghezza cumulativa
  const cumLen = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    cumLen.push(cumLen[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  // Chiudi il contorno: distanza ultimo → primo
  const dxClose = pts[0].x - pts[pts.length - 1].x;
  const dyClose = pts[0].y - pts[pts.length - 1].y;
  const totalLen = cumLen[cumLen.length - 1] + Math.sqrt(dxClose * dxClose + dyClose * dyClose);

  if (totalLen === 0) return [];

  // Campiona n punti equidistanti
  const sampled: NPoint[] = [];
  for (let k = 0; k < n; k++) {
    const target = (k * totalLen) / n;

    // Trova il segmento che contiene target
    let segIdx = 0;
    for (let i = 1; i < cumLen.length; i++) {
      if (cumLen[i] >= target) { segIdx = i - 1; break; }
      segIdx = i;
    }

    // Interpola
    let px: number, py: number;
    if (segIdx < pts.length - 1) {
      const segStart = cumLen[segIdx];
      const segEnd = cumLen[segIdx + 1];
      const t = segEnd > segStart ? (target - segStart) / (segEnd - segStart) : 0;
      px = pts[segIdx].x + t * (pts[segIdx + 1].x - pts[segIdx].x);
      py = pts[segIdx].y + t * (pts[segIdx + 1].y - pts[segIdx].y);
    } else {
      // Segmento di chiusura (ultimo → primo)
      const segStart = cumLen[cumLen.length - 1];
      const t = totalLen > segStart ? (target - segStart) / (totalLen - segStart) : 0;
      px = pts[pts.length - 1].x + t * dxClose;
      py = pts[pts.length - 1].y + t * dyClose;
    }

    // Normalizza a [0,1]
    sampled.push({
      x: bbox.width > 0 ? (px - bbox.x) / bbox.width : 0,
      y: bbox.height > 0 ? (py - bbox.y) / bbox.height : 0,
    });
  }

  return sampled;
}

// ---------------------------------------------------------------------------
//  Estrazione topologia (contorni + buchi + aspect ratio)
// ---------------------------------------------------------------------------

/**
 * Analizza l'immagine binaria e restituisce:
 * - contorno esterno campionato e normalizzato
 * - numero di buchi
 * - aspect ratio (width/height)
 */
function extractTopology(binaryMat: any, size: number): DigitTopology | null {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.findContours(binaryMat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_NONE);

    if (contours.size() === 0) return null;

    // Trova il contorno esterno più grande
    let bestIdx = -1;
    let bestArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i));
      if (area > bestArea) {
        bestArea = area;
        bestIdx = i;
      }
    }

    if (bestIdx < 0) return null;

    const outerContour = contours.get(bestIdx);

    // Conta buchi: figli diretti del contorno esterno nella gerarchia
    // hierarchy ha shape [1, N, 4] → per ogni contorno: [next, prev, firstChild, parent]
    let holeCount = 0;
    const firstChild = hierarchy.intPtr(0, bestIdx)[2]; // indice del primo figlio
    if (firstChild >= 0) {
      let childIdx = firstChild;
      while (childIdx >= 0) {
        // Conta solo buchi con area significativa
        const childArea = cv.contourArea(contours.get(childIdx));
        if (childArea / bestArea >= MIN_HOLE_AREA_RATIO) {
          holeCount++;
        }
        childIdx = hierarchy.intPtr(0, childIdx)[0]; // next sibling
      }
    }

    // Bounding rect e aspect ratio
    const rect = cv.boundingRect(outerContour);
    const aspectRatio = rect.height > 0 ? rect.width / rect.height : 0;

    // Campiona punti normalizzati
    const rawPoints = contourToPoints(outerContour);
    const sampled = sampleContourPoints(rawPoints, CONTOUR_SAMPLE_POINTS, rect);

    if (sampled.length < CONTOUR_SAMPLE_POINTS) return null;

    return { outerContour: sampled, holeCount, aspectRatio };
  } finally {
    contours.delete();
    hierarchy.delete();
  }
}

// ---------------------------------------------------------------------------
//  Distanza tra contorni
// ---------------------------------------------------------------------------

/**
 * Calcola la distanza minima punto-a-punto tra due contorni,
 * provando shift rotazionali nel range ±maxShift.
 */
function contourDistance(a: NPoint[], b: NPoint[], maxShift = CONTOUR_MAX_SHIFT): number {
  const n = a.length;
  let bestDist = Infinity;

  for (let s = -maxShift; s <= maxShift; s++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const j = ((i + s) % n + n) % n;
      const dx = a[i].x - b[j].x;
      const dy = a[i].y - b[j].y;
      sum += dx * dx + dy * dy;
    }
    const dist = Math.sqrt(sum / n);
    if (dist < bestDist) bestDist = dist;
  }

  return bestDist;
}

// ---------------------------------------------------------------------------
//  Matching
// ---------------------------------------------------------------------------

/**
 * Confronta la topologia estratta con i template.
 * 1. Filtro per holeCount
 * 2. Short-circuit per "1" via aspect ratio
 * 3. Distanza contorno + penalità aspect ratio
 */
function matchContour(topology: DigitTopology): { digit: number; scores: CellMatchScore[] } {
  // Short-circuit: aspect ratio molto stretto → "1"
  if (topology.aspectRatio < ASPECT_RATIO_1_THRESHOLD && topology.holeCount === 0) {
    return {
      digit: 1,
      scores: [{ digit: 1, distance: 0 }],
    };
  }

  // Fallback topologico se non ci sono template
  if (CONTOUR_TEMPLATES.length === 0) {
    return fallbackByTopology(topology);
  }

  // Filtra template per holeCount
  const candidates = CONTOUR_TEMPLATES.filter(t => t.holeCount === topology.holeCount);

  // Se nessun candidato per questo holeCount, usa tutti
  const pool = candidates.length > 0 ? candidates : CONTOUR_TEMPLATES;

  const scores: CellMatchScore[] = [];
  for (const tmpl of pool) {
    const cDist = contourDistance(topology.outerContour, tmpl.contour);
    const arPenalty = AR_PENALTY_WEIGHT * Math.abs(topology.aspectRatio - tmpl.aspectRatio);
    const totalDist = cDist + arPenalty;
    scores.push({ digit: tmpl.digit, distance: +totalDist.toFixed(4) });
  }

  scores.sort((a, b) => a.distance - b.distance);
  return { digit: scores[0].digit, scores };
}

/**
 * Fallback quando non ci sono template: usa solo topologia e aspect ratio.
 * Restituisce la cifra più probabile per il gruppo topologico.
 */
function fallbackByTopology(topology: DigitTopology): { digit: number; scores: CellMatchScore[] } {
  const { holeCount, aspectRatio } = topology;

  let digit: number;

  if (holeCount === 2) {
    digit = 8;
  } else if (holeCount === 1) {
    // 4, 6, 9 — discrimina con aspect ratio
    // 4 è tipicamente più largo, 6 e 9 sono simili
    if (aspectRatio > 0.65) {
      digit = 4;
    } else {
      digit = 6; // 6 e 9 indistinguibili senza contorno
    }
  } else {
    // 0 buchi: 1, 2, 3, 5, 7
    if (aspectRatio < ASPECT_RATIO_1_THRESHOLD) {
      digit = 1;
    } else {
      digit = 7; // fallback generico
    }
  }

  return {
    digit,
    scores: [{ digit, distance: 0 }],
  };
}

// ---------------------------------------------------------------------------
//  Utility: genera template da immagini reali
// ---------------------------------------------------------------------------

/**
 * Analizza una cella e logga il template vettoriale per la cifra indicata.
 * Usare per popolare CONTOUR_TEMPLATES con dati reali.
 *
 * Esempio di utilizzo:
 *   await logContourTemplate(cellBuffer, context, 3);
 *   // → logga il JSON del ContourTemplate per la cifra 3
 */
export const getContourTemplate = async (
  cellBuffer: Buffer,
  context: OcrContext,
  knownDigit: number
): Promise<ContourTemplate|null> => {
  const img = await Jimp.read(cellBuffer);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const pixels = extractDarkPixels(img, context);
  const size = context.options.imageOptions.cellSize;

  const binaryMat = pixelsToBinaryMat(pixels, size);
  const topology = extractTopology(binaryMat, size);
  binaryMat.delete();

  if (!topology) {
    console.log(
      `[ocr] logTemplate: digit ${knownDigit} — no topology extracted`
    );
    return null;
  }

  const template: ContourTemplate = {
    digit: knownDigit,
    holeCount: topology.holeCount,
    aspectRatio: +topology.aspectRatio.toFixed(4),
    contour: topology.outerContour.map((p) => ({
      x: +p.x.toFixed(4),
      y: +p.y.toFixed(4),
    })),
  };

  console.log(`[ocr] contour-template ${JSON.stringify(template)}`);

  return template;
};

