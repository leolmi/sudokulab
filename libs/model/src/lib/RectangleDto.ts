export interface RectangleDto {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export interface VectorDto {
  x: number;
  y: number;
}

export interface AreaDto {
  w: number;
  h: number;
}

export interface ShapeDto {
  readonly tl: VectorDto;
  readonly tr: VectorDto;
  readonly bl: VectorDto;
  readonly br: VectorDto;
}
