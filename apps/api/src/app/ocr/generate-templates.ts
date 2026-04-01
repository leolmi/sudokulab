/**
 * Script per generare i CONTOUR_TEMPLATES dalle 9 immagini campione.
 * Eseguire con: npx ts-node generate-templates.ts
 *
 * Legge images/1.png ... images/9.png e logga il JSON di ogni template.
 */
import * as fs from 'fs';
import * as path from 'path';
import { getContourTemplate } from './ocr.cell-reader';

// Simula un OcrContext minimale con la cellSize corretta
const CELL_SIZE = 50; // adattare se diverso

const fakeContext: any = {
  options: {
    imageOptions: {
      cellSize: CELL_SIZE,
    },
  },
};

/**
 * genera template dei valori numerici
 */
async function generate(pt: string, digit: number) {
  const imagesDir = path.resolve(__dirname, pt);

  const filePath = path.join(imagesDir, `${digit}.png`);
  if (!fs.existsSync(filePath)) {
    console.error(`[generate] File not found: ${filePath}`);
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  console.log(`[generate] Processing digit ${digit}...`);
  return await getContourTemplate(buffer, fakeContext, digit);
}
