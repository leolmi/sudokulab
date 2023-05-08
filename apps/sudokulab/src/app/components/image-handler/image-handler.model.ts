export const RADIUS = 12;
export const PADDING = 20;

export type CropPointPosition = 'TopLeft'|'TopRight'|'BottomLeft'|'BottomRight'|'none';

export interface Vector {
  x: number;
  y: number;
}

export interface Size {
  w: number,
  h: number
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RectPos {
  l: number;
  t: number;
  r: number;
  b: number;
}

/**
 * forma a 4 vertici
 */
export class Shape {
  constructor(s?: Partial<Shape>) {
    this.tl = s?.tl || {x: 0, y: 0};
    this.tr = s?.tr || {x: 0, y: 0};
    this.bl = s?.bl || {x: 0, y: 0};
    this.br = s?.br || {x: 0, y: 0};
  }

  tl: Vector;
  tr: Vector;
  bl: Vector;
  br: Vector;
}

export class CropInfo {
  constructor(c?: Partial<CropInfo>) {
    this.shape = new Shape(c?.shape);
    this.area = { w: c?.area?.w||0, h: c?.area?.h||0 }
  }

  shape: Shape;
  area: Size;
}

export const DEFAULT_SVG_RECT: Rect = {
  x: 0,
  y: 0,
  w: 90,
  h: 90,
}

export const SHAPEPOINT = {
  'TopLeft': 'tl',
  'TopRight': 'tr',
  'BottomLeft': 'bl',
  'BottomRight': 'br'
}
