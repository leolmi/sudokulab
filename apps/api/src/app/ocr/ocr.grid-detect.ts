import { cv } from 'opencv-wasm';
import { Pos, Quad } from '@olmi/model';

/** area minima del quadrilatero rispetto all'immagine */
const MIN_AREA_RATIO = 0.05;

/**
 * Rileva il quadrilatero della griglia sudoku (contorno a 4 lati più grande).
 * Restituisce null se non lo trova.
 */
export const detectGridQuad = (rgba: Uint8Array, width: number, height: number): Quad | null => {
  const mats: any[] = [];
  const track = <T>(m: T): T => (mats.push(m), m);
  try {
    const src = track(cv.matFromArray(height, width, cv.CV_8UC4, rgba));
    const gray = track(new cv.Mat());
    const blurred = track(new cv.Mat());
    const thresh = track(new cv.Mat());
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0);
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

    const contours = track(new cv.MatVector());
    const hierarchy = track(new cv.Mat());
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let best: Pos[] | null = null;
    let bestArea = width * height * MIN_AREA_RATIO;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area < bestArea) continue;
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true);
      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        bestArea = area;
        best = Array.from({ length: 4 }, (_, k) => ({ x: approx.intPtr(k, 0)[0], y: approx.intPtr(k, 0)[1] }));
      }
      approx.delete();
    }
    return best ? orderPoints(best) : null;
  } finally {
    mats.forEach(m => { try { m.delete(); } catch { /* ignore */ } });
  }
};

/** quadrilatero coincidente con l'intera immagine */
export const fullImageQuad = (width: number, height: number): Quad => new Quad({
  tl: { x: 0, y: 0 },
  tr: { x: width, y: 0 },
  br: { x: width, y: height },
  bl: { x: 0, y: height },
});

/** ordina 4 punti in: top-left, top-right, bottom-right, bottom-left */
function orderPoints(pts: Pos[]): Quad {
  const bySum = [...pts].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const byDiff = [...pts].sort((a, b) => (a.y - a.x) - (b.y - b.x));
  return new Quad({ tl: bySum[0], br: bySum[3], tr: byDiff[0], bl: byDiff[3] });
}
