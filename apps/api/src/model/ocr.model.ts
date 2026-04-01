import { OcrOptions } from './ocr.options';

export interface Pos {
  x: number;
  y: number;
}

export class OcrCellImage {
  constructor(c?: Partial<OcrCellImage>) {
    Object.assign(<any>this, c||{});
  }
  image?: any;
  populated?: boolean;
  index?: number;
}

export class OcrContext {
  constructor(c?: Partial<OcrContext>) {
    Object.assign(<any>this, c || {});
    this.cells = [];
    this.options = new OcrOptions(c?.options);
    this.folder = `scan-${Date.now()}`;
    this.debug = !!c?.debug;
  }

  raw?: Buffer;
  image?: any;
  cells: OcrCellImage[];
  folder: string;
  options: OcrOptions;
  debug: boolean;
}
