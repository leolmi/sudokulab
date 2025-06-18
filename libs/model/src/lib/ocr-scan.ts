import { Pos, Quad } from './pos';


export interface OcrScanDoubt {
  image?: string;
  map?: string;
  cell?: Pos;
}


export interface OcrScanResult {
  values: string;
  doubts: OcrScanDoubt[];
}

export interface OcrScanMap {
  map: string;
  text: string;
}

export interface OcrScanArgs {
  data: string;
  crop?: Quad;
}
