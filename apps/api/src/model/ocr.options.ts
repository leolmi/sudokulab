import { ResizeStrategy } from 'jimp';

export const MAP_CELL_SIZE = 24;
export const DEFAULT_OCR_MODE = 'near';

export class ProcessImageOptions {
  constructor(o?: Partial<ProcessImageOptions>) {
    this.cellSize = o?.cellSize||MAP_CELL_SIZE;
    this.brightness = o?.brightness||0.3;
    this.contrast = o?.contrast||0.4;
    this.resizeStrategy = o?.resizeStrategy||ResizeStrategy.BICUBIC;
  }

  cellSize: number;
  brightness: number;
  contrast: number;
  resizeStrategy: ResizeStrategy;
}


export class OcrOptions {
  constructor(o?: Partial<OcrOptions>) {
    this.rank = 9;
    this.cell_padding_perc = 0.1;
    this.min_confidenze_value = 70;
    this.min_confidenze = 30;
    this.mode = DEFAULT_OCR_MODE;
    Object.assign(<any>this, o || {});
    this.imageOptions = new ProcessImageOptions(o?.imageOptions);
  }
  rank: number;
  cell_padding_perc: number;
  min_confidenze_value: number;
  min_confidenze: number;
  imageOptions: ProcessImageOptions;
  mode: 'spiral'|'near'
}
