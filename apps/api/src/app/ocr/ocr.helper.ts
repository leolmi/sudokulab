import {
  OcrCellImage,
  OcrContext,
  Pos,
} from '../../model/ocr.model';
import { Jimp } from 'jimp';
import { readCell } from './ocr.cell-reader';
import { detectGrid } from './ocr.grid-detect';
import { OcrResult } from '../../model/ocr.result';
import { saveImage } from './io.helper';
import { Logger } from '@nestjs/common';

export const posByIndex = (i: number): Pos => (<Pos>{ x: i % 9, y: Math.floor(i / 9) });

/**
 * Preprocessing dell'immagine:
 * - grid detection (OpenCV)
 * - greyscale
 * - lighten + contrast
 * - resize a (cellSize * 9) px
 */
export const preProcessImage = async (context: OcrContext) => {
  if (context.debug)
    Logger.debug(`[ocr] Preprocessing: raw image ${context.raw!.length} bytes`);


  // Rileva e ritaglia la griglia sudoku dall'immagine
  const gridBuffer = await detectGrid(context);
  context.image = await Jimp.read(gridBuffer);

  const size = context.options.imageOptions.cellSize * 9;
  if (context.debug)
    Logger.debug(
      `[ocr] Preprocessing: greyscale + contrast + resize to ${size}x${size}`
    );
  context.image
    .color([
      { apply: 'greyscale' },
      { apply: 'lighten', params: [25] }
    ])
    .contrast(.5)
    .resize({ w: size, h: size, mode: context.options.imageOptions.resizeStrategy });

  if (context.debug)
    saveImage(context.image, context.folder, 'preprocessed.png');
}

/**
 * Divide l'immagine in 81 celle e marca quelle valorizzate
 */
export const splitImage = (context: OcrContext) => {
  const size = context.options.imageOptions.cellSize;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = new OcrCellImage({ index: r * 9 + c });
      cell.image = context.image!.clone();
      cell.image.crop({ x: size * c, y: size * r, w: size, h: size });
      context.cells.push(cell);
      if (context.debug)
        saveImage(cell.image, context.folder, `cell-${c}-${r}.png`);
    }
  }
  if (context.debug)
    Logger.debug(`[ocr] Split 81 cells`);
};

export const scanCells  = async (context: OcrContext) => {
  if (context.debug)
    Logger.debug(`[ocr] Scan: starting custom recognition...`);
  const valuesList: string[] = [];

  for (const c of context.cells) {
    const buffer = await c.image!.getBuffer('image/png');
    const value = await readCell(buffer, context, c.index);
    valuesList.push(`${value}`);
  }

  const values = valuesList.join('');
  return new OcrResult({ values });
};
