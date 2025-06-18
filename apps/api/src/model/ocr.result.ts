import { Pos } from './ocr.model';

export class OcrDoubt {
  constructor(r?: Partial<OcrDoubt>) {
    this.image = r?.image||'';
    this.cell = r?.cell;
    this.map = r?.map||'';
  }
  image: string;
  map: string;
  cell?: Pos;
}

export class OcrResult {
  constructor(r?: Partial<OcrResult>) {
    this.values = r?.values||'';
    this.doubts = (r?.doubts||[]).map(d => new OcrDoubt(d));
  }
  values: string;
  doubts: OcrDoubt[];
}
