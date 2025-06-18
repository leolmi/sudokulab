export class Pos {
  constructor(p?: Partial<Pos>) {
    Object.assign(<any>this, p || {});

    this.x = p?.x||0;
    this.y = p?.y||0;
  }

  x: number;
  y: number;
}


export class Quad {
  constructor(r?: Partial<Quad>) {
    this.tl = new Pos(r?.tl);
    this.tr = new Pos(r?.tr);
    this.bl = new Pos(r?.bl);
    this.br = new Pos(r?.br);
  }
  tl: Pos;
  tr: Pos;
  bl: Pos;
  br: Pos;
}
