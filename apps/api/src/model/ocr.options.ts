export class OcrOptions {
  constructor(o?: Partial<OcrOptions>) {
    this.rank = 9;
    this.cell_padding_perc = 0.1;
    this.min_confidenze_value = 70;
    this.min_confidenze = 30;
    Object.assign(<any>this, o || {});
  }
  rank: number;
  cell_padding_perc: number;
  min_confidenze_value: number;
  min_confidenze: number;
}
