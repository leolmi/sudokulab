import { ResizeStrategy } from 'jimp';

export const MAP_CELL_SIZE = 50;

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
    this.confidenceThreshold = 60;
    Object.assign(<any>this, o || {});
    this.imageOptions = new ProcessImageOptions(o?.imageOptions);
  }
  rank: number;
  cell_padding_perc: number;
  confidenceThreshold: number;
  imageOptions: ProcessImageOptions;
}
