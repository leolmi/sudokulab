export class OcrResult {
  constructor(r?: Partial<OcrResult>) {
    this.values = '';
    this.cells = {};
    this.confidence = 0;
    Object.assign(<any>this, r || {});
  }
  cells: any;
  values: string;
  confidence: number;
  image?: string;
  data?: any;
}
