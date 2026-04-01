import { Jimp } from 'jimp';
import { OcrContext } from '../../model/ocr.model';

// const CELL_SIZE = 50;
// const BORDER_MARGIN = 5;                 // pixel di bordo da escludere
const BORDER_MARGIN_PERCENT = 0.1;   // percentuale spessore bordo rispetto a dimensione cella
// const MAX_RADIUS = Math.floor(CELL_SIZE / 2) - BORDER_MARGIN; // raggio utile spirale
const DARK_THRESHOLD = 128;              // sotto = pixel "inchiostro"
const MIN_PIXEL_COUNT = 15;              // minimo pixel scuri per considerare la cella piena

/**
 * Griglia 5×5 di densità normalizzata per ogni cifra (1-9).
 * Ogni template è un array di 25 valori [0..1] letti riga per riga.
 * I pesi rappresentano la probabilità che una zona sia "piena".
 */
const DIGIT_TEMPLATES: Record<number, number[]> = {
  1: [
    0.0, 0.4, 0.8, 0.0, 0.0,
    0.0, 0.8, 0.8, 0.0, 0.0,
    0.0, 0.2, 0.8, 0.0, 0.0,
    0.0, 0.2, 0.8, 0.0, 0.0,
    0.0, 0.4, 0.9, 0.4, 0.0,
  ],
  2: [
    0.3, 0.7, 0.7, 0.7, 0.3,
    0.5, 0.1, 0.0, 0.3, 0.7,
    0.0, 0.1, 0.4, 0.7, 0.3,
    0.3, 0.7, 0.4, 0.1, 0.0,
    0.7, 0.7, 0.7, 0.7, 0.7,
  ],
  3: [
    0.3, 0.7, 0.7, 0.7, 0.3,
    0.5, 0.0, 0.0, 0.3, 0.7,
    0.0, 0.3, 0.7, 0.7, 0.3,
    0.5, 0.0, 0.0, 0.3, 0.7,
    0.3, 0.7, 0.7, 0.7, 0.3,
  ],
  4: [
    0.5, 0.0, 0.0, 0.5, 0.0,
    0.7, 0.0, 0.0, 0.7, 0.0,
    0.7, 0.3, 0.3, 0.7, 0.3,
    0.7, 0.7, 0.7, 0.9, 0.7,
    0.0, 0.0, 0.0, 0.7, 0.0,
  ],
  5: [
    0.7, 0.7, 0.7, 0.7, 0.7,
    0.7, 0.3, 0.0, 0.0, 0.0,
    0.7, 0.7, 0.7, 0.7, 0.3,
    0.0, 0.0, 0.0, 0.3, 0.7,
    0.7, 0.7, 0.7, 0.7, 0.3,
  ],
  6: [
    0.1, 0.5, 0.7, 0.7, 0.3,
    0.5, 0.5, 0.1, 0.0, 0.0,
    0.7, 0.7, 0.7, 0.7, 0.3,
    0.7, 0.2, 0.0, 0.3, 0.7,
    0.3, 0.7, 0.7, 0.7, 0.3,
  ],
  7: [
    0.7, 0.7, 0.7, 0.7, 0.7,
    0.0, 0.0, 0.0, 0.5, 0.5,
    0.0, 0.0, 0.3, 0.7, 0.0,
    0.0, 0.2, 0.7, 0.2, 0.0,
    0.0, 0.5, 0.7, 0.0, 0.0,
  ],
  8: [
    0.3, 0.7, 0.7, 0.7, 0.3,
    0.7, 0.2, 0.0, 0.2, 0.7,
    0.3, 0.7, 0.7, 0.7, 0.3,
    0.7, 0.2, 0.0, 0.2, 0.7,
    0.3, 0.7, 0.7, 0.7, 0.3,
  ],
  9: [
    0.3, 0.7, 0.7, 0.7, 0.3,
    0.7, 0.3, 0.0, 0.2, 0.7,
    0.3, 0.7, 0.7, 0.7, 0.7,
    0.0, 0.0, 0.1, 0.5, 0.5,
    0.3, 0.7, 0.7, 0.5, 0.1,
  ],
};

// ---------------------------------------------------------------------------
// Lettura cella
// ---------------------------------------------------------------------------

/**
 * Legge una cella 50×50 e restituisce il numero riconosciuto (1-9) oppure 0 se vuota.
 */
export const readCell = async (
  cellBuffer: Buffer,
  context: OcrContext
): Promise<number> => {
  const img = await Jimp.read(cellBuffer);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const pixels = extractDarkPixels(img, context);

  if (pixels.length < MIN_PIXEL_COUNT) {
    return 0; // cella vuota
  }

  const zones = buildZoneDensity(pixels, context);
  return matchDigit(zones);
};

// ---------------------------------------------------------------------------
//  Spirale dal centro
// ---------------------------------------------------------------------------

interface Pixel { x: number; y: number }

/**
 * Scansione a spirale dal centro della cella.
 * Raccoglie tutti i pixel scuri entro MAX_RADIUS, escludendo il bordo.
 */
function extractDarkPixels(
  img: InstanceType<typeof Jimp>,
  context: OcrContext
): Pixel[] {
  const size = context.options.imageOptions.cellSize;
  const margin = Math.floor(size * BORDER_MARGIN_PERCENT);
  const max_radius = Math.floor(size / 2) - margin;
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const darkPixels: Pixel[] = [];

  // Genera coordinate a spirale crescente per raggio
  for (let r = 0; r <= max_radius; r++) {
    const coords = ringCoords(cx, cy, r);
    for (const { x, y } of coords) {
      if (x < margin || x >= size - margin) continue;
      if (y < margin || y >= size - margin) continue;
      if (isDark(img, x, y)) {
        darkPixels.push({ x, y });
      }
    }
  }

  return darkPixels;
}

/**
 * Restituisce tutte le coordinate intere sull'anello a distanza `r` dal centro.
 * Usa il cerchio discreto di Bresenham-like: tutti i punti (x,y) con floor(dist) == r.
 */
function ringCoords(cx: number, cy: number, r: number): Pixel[] {
  if (r === 0) return [{ x: cx, y: cy }];

  const result: Pixel[] = [];
  // Scansione del quadrato circoscritto, filtro per distanza
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Math.round(dist) === r) {
        result.push({ x: cx + dx, y: cy + dy });
      }
    }
  }
  return result;
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
//  Griglia di densità 5×5
// ---------------------------------------------------------------------------

/**
 * Calcola il bounding box dei pixel, lo divide in una griglia 5×5
 * e restituisce la densità normalizzata [0..1] di ogni zona.
 */
function buildZoneDensity(pixels: Pixel[], context: OcrContext): number[] {
  // Bounding box
  const size = context.options.imageOptions.cellSize;
  let minX = size,
    minY = size,
    maxX = 0,
    maxY = 0;
  for (const p of pixels) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;

  // Griglia 5×5 di contatori
  const GRID = 5;
  const counts = new Array(GRID * GRID).fill(0);
  const zoneSizes = new Array(GRID * GRID).fill(0);

  const zoneW = bw / GRID;
  const zoneH = bh / GRID;

  // Calcola l'area di ogni zona (per normalizzare)
  for (let zy = 0; zy < GRID; zy++) {
    for (let zx = 0; zx < GRID; zx++) {
      const x0 = Math.floor(zx * zoneW);
      const x1 = Math.floor((zx + 1) * zoneW);
      const y0 = Math.floor(zy * zoneH);
      const y1 = Math.floor((zy + 1) * zoneH);
      zoneSizes[zy * GRID + zx] = Math.max(1, (x1 - x0) * (y1 - y0));
    }
  }

  // Assegna ogni pixel alla sua zona
  for (const p of pixels) {
    const zx = Math.min(Math.floor(((p.x - minX) / bw) * GRID), GRID - 1);
    const zy = Math.min(Math.floor(((p.y - minY) / bh) * GRID), GRID - 1);
    counts[zy * GRID + zx]++;
  }

  // Normalizza: densità = count / area della zona
  return counts.map((c, i) => Math.min(1, c / zoneSizes[i]));
}

// ---------------------------------------------------------------------------
//  Matching
// ---------------------------------------------------------------------------

/**
 * Confronta la densità zonale con ogni template e ritorna la cifra col punteggio migliore.
 * Distanza euclidea normalizzata.
 */
function matchDigit(zones: number[]): number {
  let bestDigit = 0;
  let bestScore = Infinity;

  for (const [digit, template] of Object.entries(DIGIT_TEMPLATES)) {
    let sum = 0;
    for (let i = 0; i < zones.length; i++) {
      const diff = zones[i] - template[i];
      sum += diff * diff;
    }
    const score = Math.sqrt(sum);
    if (score < bestScore) {
      bestScore = score;
      bestDigit = Number(digit);
    }
  }

  return bestDigit;
}
