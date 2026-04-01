import { cv } from 'opencv-wasm';
import { Jimp } from 'jimp';
import { saveImage } from './io.helper';
import { OcrContext } from '../../model/ocr.model';

/**
 * Rileva la griglia sudoku in un'immagine e restituisce una vista top-down.
 * Se non trova una griglia, ritorna il buffer originale.
 */
export const detectGrid = async (context: OcrContext): Promise<Buffer> => {
  const imageBuffer = context.raw!;
  if (context.debug) console.log('[ocr] Grid detection: starting...');
  const jimpImg = await Jimp.read(imageBuffer);
  const width = jimpImg.width;
  const height = jimpImg.height;
  if (context.debug)
    console.log(`[ocr] Grid detection: image ${width}x${height}`);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  if (context.debug) saveImage(jimpImg, context.folder, 'original.png');

  // Jimp → cv.Mat (grayscale)
  const gray = new cv.Mat(height, width, cv.CV_8UC1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = jimpImg.getPixelColor(x, y);
      const r = (color >> 24) & 0xff;
      const g = (color >> 16) & 0xff;
      const b = (color >> 8) & 0xff;
      const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      gray.ucharPtr(y, x)[0] = luma;
    }
  }

  try {
    // Blur + adaptive threshold
    const blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0);

    const thresh = new cv.Mat();
    cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

    // Trova contorni
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Cerca il contorno quadrilatero più grande
    let bestContour: any = null;
    let bestArea = 0;
    const minArea = width * height * 0.1; // almeno 10% dell'immagine

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area < minArea) continue;

      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);

      if (approx.rows === 4 && area > bestArea) {
        if (bestContour) bestContour.delete();
        bestContour = approx;
        bestArea = area;
      } else {
        approx.delete();
      }
    }

    if (!bestContour) {
      console.log('[ocr] Grid detection: no grid found, using original image');
      cleanup(gray, blurred, thresh, contours, hierarchy);
      return imageBuffer;
    }

    // Ordina i 4 punti: top-left, top-right, bottom-right, bottom-left
    const points = orderPoints(bestContour);
    console.log(`[ocr] Grid detection: grid found, corners:`, points.map(p => `(${p.x},${p.y})`).join(' '));

    // Calcola dimensione output (lato più lungo)
    const side = Math.max(
      distance(points[0], points[1]),
      distance(points[1], points[2]),
      distance(points[2], points[3]),
      distance(points[3], points[0])
    );
    const outputSize = Math.round(side);

    // Perspective transform
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      points[0].x, points[0].y,
      points[1].x, points[1].y,
      points[2].x, points[2].y,
      points[3].x, points[3].y,
    ]);
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      outputSize, 0,
      outputSize, outputSize,
      0, outputSize,
    ]);

    const M = cv.getPerspectiveTransform(srcPoints, dstPoints);
    const warped = new cv.Mat();

    // Usa l'immagine originale (non gray) per il warp
    const src = new cv.Mat(height, width, cv.CV_8UC4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = jimpImg.getPixelColor(x, y);
        const ptr = src.ucharPtr(y, x);
        ptr[0] = (color >> 24) & 0xff; // R
        ptr[1] = (color >> 16) & 0xff; // G
        ptr[2] = (color >> 8) & 0xff;  // B
        ptr[3] = color & 0xff;         // A
      }
    }

    cv.warpPerspective(src, warped, M, new cv.Size(outputSize, outputSize));

    // cv.Mat → Jimp → Buffer
    const result = new Jimp({ width: outputSize, height: outputSize });
    for (let y = 0; y < outputSize; y++) {
      for (let x = 0; x < outputSize; x++) {
        const ptr = warped.ucharPtr(y, x);
        const color = (((ptr[0] & 0xff) << 24) | ((ptr[1] & 0xff) << 16) | ((ptr[2] & 0xff) << 8) | (ptr[3] & 0xff)) >>> 0;
        result.setPixelColor(color, x, y);
      }
    }

    if (context.debug) saveImage(result, context.folder, 'warped.png');

    // Cleanup OpenCV mats
    cleanup(gray, blurred, thresh, contours, hierarchy);
    bestContour.delete();
    srcPoints.delete();
    dstPoints.delete();
    M.delete();
    warped.delete();
    src.delete();

    if (context.debug)
      console.log(
        `[ocr] Grid detection: perspective transform done, output ${outputSize}x${outputSize}`
      );
    return await result.getBuffer('image/png');
  } catch (err) {
    if (context.debug)
      console.error('[ocr] Grid detection: error, using original image', err);
    gray.delete();
    return imageBuffer;
  }
};

/**
 * Ordina 4 punti in: top-left, top-right, bottom-right, bottom-left
 */
function orderPoints(contour: any): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 4; i++) {
    pts.push({ x: contour.intPtr(i, 0)[0], y: contour.intPtr(i, 0)[1] });
  }

  // Ordina per somma (x+y): min = top-left, max = bottom-right
  const sorted = [...pts].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const tl = sorted[0];
  const br = sorted[3];

  // Ordina per differenza (y-x): min = top-right, max = bottom-left
  const sortedDiff = [...pts].sort((a, b) => (a.y - a.x) - (b.y - b.x));
  const tr = sortedDiff[0];
  const bl = sortedDiff[3];

  return [tl, tr, br, bl];
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function cleanup(...mats: any[]) {
  for (const m of mats) {
    try { m.delete(); } catch { /* ignore */ }
  }
}
