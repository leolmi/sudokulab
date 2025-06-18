import { Quad } from './ocr.model';

export interface ImgDto {
  readonly data: string;
  readonly crop?: Quad;
}
