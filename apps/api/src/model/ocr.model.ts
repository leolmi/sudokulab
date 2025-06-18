import { JimpInstance } from 'jimp';
import { OcrOptions } from './ocr.options';

export const OCR_MAP_SIZE = 12;
export const OCR_MIDDLE_COLOR_TOLERANCE = 0.1; // (10% di tolleranza sul colore mediano)
export const OCR_MAP_POINT_SEPARATOR = ';';

export interface Pos {
  x: number;
  y: number;
}

export interface Quad {
  tl: Pos;
  tr: Pos;
  bl: Pos;
  br: Pos;
}

export interface SizePos extends Pos{
  r: number;
  b: number;
  w: number;
  h: number;
}


export interface OcrMap {
  size: number;
  // testo corrispondente
  text: string;
  // matrice mappa
  map: string;
}


export interface ScanContext {
  image?: JimpInstance;
  debug?: boolean;
  middleColor?: number;
  starter?: Pos[];
  mode?: 'spiral'|'near',
  maps?: OcrMap[];
  ocrMap?: OcrMap;
  map?: string[];
}


export class OcrCellImage {
  constructor(c?: Partial<OcrCellImage>) {
    Object.assign(<any>this, c||{});
  }
  image?: any;
  imageMap?: OcrMap;
  index?: number;
}

export class OcrContext {
  constructor(c?: Partial<OcrContext>) {
    Object.assign(<any>this, c||{});
    this.cells = [];
    this.options = new OcrOptions(c?.options);
  }

  raw?: Buffer;
  image?: any;
  cells: OcrCellImage[];
  options: OcrOptions;
  middleColor?: number;
}


