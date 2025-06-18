import {
  OCR_MAP_POINT_SEPARATOR,
  OCR_MIDDLE_COLOR_TOLERANCE,
  OcrCellImage,
  OcrContext,
  OcrMap,
  Pos, Quad,
  ScanContext
} from '../../model/ocr.model';
import { Jimp, JimpInstance } from 'jimp';
import { buildCellMap, scanOnMap } from './ocr.maps';
import { OcrDoubt, OcrResult } from '../../model/ocr.result';

export const pidToPos = (pid?: string): Pos|undefined => {
  if (!pid) return undefined;
  const vls = (pid||'').split('.');
  return <Pos>{
    x: parseInt(vls[0], 10),
    y: parseInt(vls[1], 10)
  }
}

export const posToPid = (p: Pos): string => `${p.x}.${p.y}`;

export const posByIndex = (i: number): Pos => (<Pos>{ x: i%9, y: Math.floor(i/9) });

export const mapStringToArray = (m: string): string[] => `${m||''}`.split(OCR_MAP_POINT_SEPARATOR);

export const calcMiddleColor = (ctx: ScanContext): number => {
  const h = ctx.image.height, w = ctx.image.width;
  const range: any = { min: 0xffffffff, max: 0 };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const clr = ctx.image.getPixelColor(x, y);
      if (clr > range.max) range.max = clr;
      if (clr < range.min) range.min = clr;
    }
  }
  // console.log('MIDDLE COLOR RANGE', range);
  const mc = range.min + ((range.max - range.min) / 2);
  return Math.floor(mc * (1+OCR_MIDDLE_COLOR_TOLERANCE));
}


/**
 * cicla tutti i pixel adiacenti dall'alto verso il basso da sinistra a destra
 * @param center
 * @param handler
 */
export const traverseNear = (center: Pos|undefined, handler: (pos: Pos, pid: string) => void) => {
  if (!center) return;
  for (let y = center.y - 1; y < (center.y + 2); y++) {
    for (let x = center.x - 1; x < center.x + 2; x++) {
      const pos = <Pos>{ x, y };
      const pid = posToPid(pos);
      handler(pos, pid);
    }
  }
}


export const findFirstNear = (cpid: string, m: string[]): string|undefined => {
  let near: string|undefined = undefined;
  traverseNear(pidToPos(cpid), (pos, pid) =>
    near = near || m.find(mpid => mpid === pid));
  return near;
}


// // TODO: >>>>>>>>>>>>> DEBUG SAVE
// export const DEBUG_saveTempImage = (img: JimpInstance, title?: string) => {
//   console.log(`saving image "${title}" (${img.width}, ${img.height}) ...`);
//   img.write(`./dist/images/image_${title||''}_${Date.now()}.png`);
// }
// // impostare la cella da utilizzare per il debug
// const IS_DEBUG_CELL = (index: number): boolean => {
//   return (index === 34); // è un "5"
// }
// // TODO: <<<<<<<<<<<<< DEBUG SAVE


const _crop = (img: any, crop?: Quad) => {
  if (!crop) return img;

  // TODO: crop...

  return img;
}

/**
 * primo processo dell'immagine:
 * - grey-scale
 * - brightness
 * - contrast
 * - resize
 * @param context
 * @param crop
 */
export const preProcessImage = async (context: OcrContext, crop?: Quad) => {
  // console.log('PRE-PROCESS IMAGE START...');
  const raw = await Jimp.read(context.raw);
  context.image = _crop(raw, crop);
  // DEBUG_saveTempImage(context.image, 'pre-processed');
  // console.log('CONTEXT IMAGE', typeof context.image);
  // console.log('IMAGE OPTIONS', context.options.imageOptions);

  const size = context.options.imageOptions.cellSize * 9;
  context.image
    .color([
      // scala di grigi
      { apply: 'greyscale' },
      // più chiara
      { apply: "lighten", params: [25] }
    ])
    .contrast(.3)
    // resize
    .resize({ w: size, h: size, mode: context.options.imageOptions.resizeStrategy });


  // // TODO: >>>>>>>>>>>>> DEBUG SAVE
  // DEBUG_saveTempImage(context.image, 'processed');
  // // TODO: <<<<<<<<<<<<< DEBUG SAVE
}


/**
 * crea le celle dello schema rilevando le celle valorizzate
 * @param context
 */
export const splitImage = (context: OcrContext) => {
  // console.log('SPLITTING IMAGE START...');
  const size = context.options.imageOptions.cellSize;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = new OcrCellImage({ index: (r * 9) + c });
      cell.image = context.image.clone();
      const cropOptions = { x: size * c, y: size * r, w: size, h: size };
      cell.image.crop(cropOptions);
      const ctx = <ScanContext>{
        image: cell.image,
        // debug: IS_DEBUG_CELL(cell.index),
        mode: context.options.mode
      }
      cell.imageMap = buildCellMap(ctx);
      if (ctx.middleColor && !context.middleColor) context.middleColor = ctx.middleColor;

      context.cells.push(cell);

      // console.log(`CELLA (${c},${r}) CON VALORE = ${!!cell.imageMap}`);
      // if (cell.imageMap) {
      //   console.log(`CELL ${cell.index} IMAGE MAP CREATED (size=${cell.imageMap.size}), map=`, cell.imageMap.map);
      //   // DEBUG_saveTempImage(cell.image, `original_${c}_${r}`);
      //   DEBUG_saveTempImage(cell.image, `cell ${cell.index} (${r}.${c})`);
      //   // console.log(`cell "${cell.index}" map`, cell.imageMap.map);
      // }
      // if (ctx.debug) {
      //   if (cell.imageMap) DEBUG_saveTempImage(cell.imageMap, `${r}.${c}`);
      //   console.log(`debug cell (index=${cell.index} [${c},${r}])`);
      //   console.log('cell crop options', cropOptions);
      //   DEBUG_saveTempImage(cell.image, `cell_${c}_${r}`);
      //   if (cell.imageMap) DEBUG_saveTempImage(cell.imageMap, `cell_map_${c}_${r}`);
      // }
    }
  }
}

export const scanCells = async (context: OcrContext, maps: OcrMap[]): Promise<OcrResult> => {
  const doubts: OcrDoubt[] = [];
  const values_list: string[] = [];
  for (const c of context.cells) {
    if (!c.imageMap) {
      // cella vuota
      values_list.push('0');
    } else {
      // console.log('CELL IMAGE MAP', c.imageMap);
      // mappa 12x12 confrontabile con quelle salvate
      // const ocrMap = getOcrImageMap(c.imageMap, context.middleColor);
      // console.log(`CELL ${c.index} (${ocrMap.size}x${ocrMap.size})`, ocrMap.map, '\noriginal map:', c.imageMap.map);
      const ctx = <ScanContext>{
        ocrMap: c.imageMap,
        maps,
        // debug: IS_DEBUG_CELL(c.index),
      }
      const r = scanOnMap(ctx);
      if ((r?.match || 0) >= 90) {
        values_list.push(r.map.text);
      } else {
        const image = await c.image.getBase64('image/bmp');
        doubts.push(new OcrDoubt({
          cell: posByIndex(c.index),
          image,
          map: c.imageMap.map
        }));
        values_list.push('?');
      }
    }
  }
  const values = values_list.join('');
  const res = new OcrResult({ doubts, values });
  // console.log('SCAN RESULT', res);
  return res;
}
