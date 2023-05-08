import {AreaDto, ImgDto, OcrOptions, OcrResult, ShapeDto} from '@sudokulab/model';
import { join } from 'path';
import { createWorker, Rectangle } from 'tesseract.js';
import * as Jimp from 'jimp';
import * as Tesseract from 'tesseract.js';

interface CellInfo {
  buffer: Buffer;
  id: string;
}

interface Elaboration {
  img: ImgDto,
  cells: CellInfo[]
}

const CELL_SIZE = 80;
const BOARD_SIZE = 720;

const translateShape = (sh: ShapeDto, rs: AreaDto, rt: AreaDto): ShapeDto => {
  const dw = rt.w / rs.w;
  const dh = rt.h / rs.h;
  return  <ShapeDto>{
    tl: {x: (sh.tl.x * dw), y: (sh.tl.y * dh)},
    tr: {x: (sh.tr.x * dw), y: (sh.tr.y * dh)},
    br: {x: (sh.br.x * dw), y: (sh.br.y * dh)},
    bl: {x: (sh.bl.x * dw), y: (sh.bl.y * dh)},
  }
}


export const ocr = async (img: ImgDto, o?: OcrOptions): Promise<OcrResult> => {
  const options = new OcrOptions(o);
  // estrae l'immagine
  const _img = Buffer.from(img.data.replace(/data:image\/.*;base64,/g, ''), 'base64');

  // carica l'immagine
  let image = await Jimp.read(_img);

  // await image.resize(500, 500);


  // info sull'immagine
  const w = image.getWidth();
  const h = image.getHeight();

  // const shape = translateShape(img.shape, img.area, {w,h});

  //console.log('crop info\n\tshape:', img.shape, '\n\tarea:', img.area, '\n\timage rect:', {w,h}, '\n\tcrop shape:', shape);

  console.log(`IMAGE INFO  size width=${w}  height=${h}`);

  // scala di grigi
  image.grayscale();
  // più chiara
  image.brightness(0.3);
  // aumenta contrasto
  image.contrast(0.5);



  await image.writeAsync(`${Date.now()}.png`);

  return <OcrResult>{
    data: {
      width: w,
      height: h
    }
  }
}



export const ocr2 = async (img: ImgDto, o?: OcrOptions): Promise<OcrResult> => {
  const options = new OcrOptions(o);
  let confidence = 0;
  const elaboration: Elaboration = { img, cells: [] };
  const dim = options.rank * options.rank;
  const cells: any = {};
  let values = '';
  const langPath = join(__dirname, 'assets');

  try {
    await elaborate(elaboration, options);
  } catch (err) {
    console.error('Error while elaborating image', err);
    return new OcrResult({ cells: {}, values: '', confidence: 0 });
  }
  try {
    const worker = createWorker({ langPath });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    await worker.setParameters({ tessedit_char_whitelist: '123456789' });

    await onCells(options.rank, async (col, row, id, i) => {
      const cell = elaboration.cells[i];
      const { data } = await worker.recognize(cell.buffer);
      const value = getCellValue(data, options);
      // console.log(`CELL "${cell.id}" TEXT=${(data.text || '').trim().replace(/\s/g, '')}  CONFIDENCE=${data.confidence}  RIGHT-VALUE=${value}`);
      if (data.confidence > 10 && data.confidence < options.min_confidenze) {
        // console.log(`SKIPPED CELL "${cell.id}" CONFIDENCE=${data.confidence}`, data);
      }
      cells[cell.id] = value;
      values = `${values}${value || '0'}`
    });
  } catch (err) {
    console.error('Error while ocr processing image', err);
    return new OcrResult({ cells: {}, values: '', confidence: 0 });
  }

  if (values.length === dim) confidence = 100;
  const result = new OcrResult({ cells, values, confidence });
  console.log('OCR RESULTS', result);
  return result;
}


const elaborate = async (elaboration: Elaboration, o: OcrOptions) => {
  const maskPath = join(__dirname, 'assets/cell-mask.png');
  const mask = await Jimp.read(maskPath);
  const _img = Buffer.from(elaboration.img.data.replace(/data:image\/.*;base64,/g, ''), 'base64');
  let image = await Jimp.read(_img);
  const w = image.getWidth();
  const h = image.getHeight();
  console.log(`ORIGINAL IMAGE SIZE width:${w}   height:${h}`);
  // console.log(`ROTATION `, elaboration.img.rotation);
  // if (elaboration.img.rotation !== 0) {
  //   image = await image.rotate(-elaboration.img.rotation, false);
  // }
  // const crop = {
  //   left: Math.floor(elaboration.img.rect.left * w),
  //   top: Math.floor(elaboration.img.rect.top * h),
  //   width: Math.floor(elaboration.img.rect.width * w),
  //   height: Math.floor(elaboration.img.rect.height * h)
  // }
  // console.log(`CROP RECT `, crop);
  // image = await image.crop(crop.left, crop.top, crop.width, crop.height);
  image = await image.resize(BOARD_SIZE, BOARD_SIZE);
  image = await image.grayscale();

  const now = Math.floor(Date.now());
  // await image.writeAsync(`C:/Users/olmil/Desktop/ocr_${now}.png`);

  elaboration.cells = [];
  const padding = o.cell_padding_perc * CELL_SIZE;
  await onCells(o.rank, async (col, row, id, i) => {
    const cCrop: Rectangle = {
      top: (row * CELL_SIZE) + padding,
      left: (col * CELL_SIZE) + padding,
      height: CELL_SIZE - (2 * padding),
      width: CELL_SIZE - (2 * padding)
    };
    console.log(`CELL [${id}] CROP`, cCrop);
    console.log(`IMAGE size`, image.getWidth(), image.getHeight());
    let cellImage = await Jimp.read(image);
    cellImage = await cellImage.crop(cCrop.left, cCrop.top, cCrop.width, cCrop.height);
    cellImage = await cellImage.mask(mask, 0, 0);
    cellImage = await cellImage.contrast(1);

    // await cellImage.writeAsync(`C:/Users/olmil/Desktop/cells/ocr_cell_${(i<10)?`0${i}`:i}_${now}.png`);
    const cellBuffer = await cellImage.getBufferAsync(Jimp.MIME_PNG);
    elaboration.cells.push({ buffer: cellBuffer, id });
  });
}

const getCellValue = (data: Tesseract.Page, o: OcrOptions): string => {
  let value = '';
  if (data.confidence > o.min_confidenze_value) {
    value = data.text||'';
  } else if (data.confidence > o.min_confidenze) {
    value = 'x';
  }
  return value.trim();
}

const onCells = async (rank = 9, handler: (col, row, id, index) => Promise<any>) => {
  const dim = rank * rank;
  let i = 0;
  do {
    const row = Math.floor(i / rank);
    const col = (i % rank);
    const id = `${col}|${row}`;
    await handler(col, row, id, i);
    i++;
  } while (i<dim);
}
