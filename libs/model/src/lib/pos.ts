export class Pos {
  constructor(p?: Partial<Pos>) {
    Object.assign(<any>this, p || {});

    this.x = p?.x||0;
    this.y = p?.y||0;
  }

  x: number;
  y: number;
}
