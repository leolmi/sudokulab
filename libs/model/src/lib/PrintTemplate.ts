export interface PrintData {
  codes: string[];
  file: string;
  schemaCount: number;
  bookmark: {[name: string]: string};
}

export interface PrintTemplate {
  code: string;
  name: string;
  file: string;
  thumbnail: string;
  schemaCount: number;
  bookmark: {[name: string]: string};
}
