import {
  CropInfo,
  CropPointPosition,
  DEFAULT_SVG_RECT,
  PADDING,
  RADIUS,
  Rect,
  RectPos,
  Shape, SHAPEPOINT,
  Size,
  Vector
} from "./image-handler.model";
import {cloneDeep as _clone} from 'lodash';

export const isEmptyVector = (v?: Vector): boolean => {
  return !v || ((v?.x||0) === 0 && (v?.y||0) === 0);
}

export const isEmptyShape = (sh?: Shape): boolean => {
  return (!sh || (isEmptyVector(sh.bl) && isEmptyVector(sh.br) && isEmptyVector(sh.tl) && isEmptyVector(sh.tr)));
}

export const getTouchMoovement = (e: any): Vector => {
  const rect = e.target.getBoundingClientRect();
  const evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
  const touch = evt.touches[0] || evt.changedTouches[0];
  return <Vector>{ x: touch.pageX - rect.left, y: touch.pageY - rect.top};
}

export const getSize = (ele: HTMLElement): Size => {
  return {
    w: ele.clientWidth - (2*PADDING),
    h: ele.clientHeight - (2*PADDING)
  }
}

export const calcPointPositions = (move: RectPos, ele: HTMLElement): Rect => {
  const size = getSize(ele);
  return {
    x: ele.clientLeft + PADDING + (size.w * move.l),
    y: ele.clientTop + PADDING + (size.h * move.t),
    w: size.w * (1 - move.l - move.r),
    h: size.h * (1 - move.t - move.b)
  }
}

export const getPointsStyle = (sh: Shape): any => {
  return {
    TopLeft: { left:`${sh.tl.x-RADIUS}px`, top: `${sh.tl.y-RADIUS}px` },
    TopRight: { left:`${sh.tr.x-RADIUS}px`, top: `${sh.tr.y-RADIUS}px` },
    BottomLeft: { left:`${sh.bl.x-RADIUS}px`, top: `${sh.bl.y-RADIUS}px` },
    BottomRight: { left:`${sh.br.x-RADIUS}px`, top: `${sh.br.y-RADIUS}px` }
  }
}

// export const getPointsStyle = (p: Rect): any => {
//   const x1 = p.x||0
//   const y1 = p.y||0;
//   const x2 = (p.w||0) + (p.x||0);
//   const y2 = (p.h||0) + (p.y||0);
//   return {
//     TopLeft: { left:`${x1-RADIUS}px`, top: `${y1-RADIUS}px` },
//     TopRight: { left:`${x2-RADIUS}px`, top: `${y1-RADIUS}px` },
//     BottomLeft: { left:`${x1-RADIUS}px`, top: `${y2-RADIUS}px` },
//     BottomRight: { left:`${x2-RADIUS}px`, top: `${y2-RADIUS}px` }
//   }
// }

// export const getAreaStyle = (p: Rect): any => {
//   return {
//     left: `${p.x || 0}px`,
//     top: `${p.y || 0}px`,
//     width: `${p.w || 0}px`,
//     height: `${p.h || 0}px`
//   }
// }

export const getElementShape = (ele: HTMLDivElement, padding = 0): Shape => {
  const r = ele.getBoundingClientRect();
  // console.log('ELE', ele, '\n\trect', r);
  return new Shape({
    tl: {x: padding, y: padding},
    tr: {x: r.width - padding, y: padding},
    br: {x: r.width - padding, y: r.height - padding},
    bl: {x: padding, y: r.height - padding}
  })
}

export const isOnPoint = (p: Vector, pos: Vector): boolean => {
  return pos.x > (p.x - RADIUS) &&
    pos.x < (p.x + RADIUS) &&
    pos.y > (p.y - RADIUS) &&
    pos.y < (p.y + RADIUS);
}

export const getCurrentPoint = (sh: Shape, e: any): CropPointPosition => {
  if (isOnPoint(sh.tl, e)) return 'TopLeft';
  if (isOnPoint(sh.tr, e)) return 'TopRight';
  if (isOnPoint(sh.bl, e)) return 'BottomLeft';
  if (isOnPoint(sh.br, e)) return 'BottomRight';
  return 'none';
}


export const getCurrentPointA = (crop: Rect, e: any): CropPointPosition => {
  if (e.x < (crop.x + RADIUS)) {
    if (e.x > (crop.x - RADIUS)) {
      // allineamento sinistro
      if (e.y < (crop.y + RADIUS)) {
        if (e.y > (crop.y - RADIUS)) {
          return 'TopLeft';
        }
      } else if (e.y < (crop.y + crop.h + RADIUS)) {
        if (e.y > (crop.y + crop.h - RADIUS)) {
          return 'BottomLeft';
        }
      }
    }
  } else if (e.x < (crop.x + crop.w + RADIUS)) {
    if (e.x > (crop.x + crop.w - RADIUS)) {
      if (e.y < (crop.y + RADIUS)) {
        if (e.y > (crop.y - RADIUS)) {
          return 'TopRight';
        }
      } else if (e.y < (crop.y + crop.h + RADIUS)) {
        if (e.y > (crop.y + crop.h - RADIUS)) {
          return 'BottomRight';
        }
      }
    }
  }
  return 'none';
}

export const emptyVector = () => ({ x:0, y:0 });

export const calcMovement = (position: RectPos,
                             movement: Vector,
                             point: CropPointPosition,
                             ele: HTMLElement): RectPos => {
  const size = getSize(ele);
  const m = _clone(position);
  // const mv: RectPos = {
  //   l: (movement.x - PADDING) / size.w,
  //   t: (movement.y - PADDING) / size.h,
  //   r: (size.w - (movement.x - PADDING)) / size.w,
  //   b: (size.h - (movement.y - PADDING)) / size.h
  // }
  // switch (point) {
  //   case 'TopLeft':
  //     m.t = mv.t
  //     m.l = mv.l;
  //     break;
  //   case 'TopRight':
  //     m.t = mv.t;
  //     m.r = mv.r;
  //     break;
  //   case 'BottomLeft':
  //     m.b = mv.b;
  //     m.l = mv.l;
  //     break;
  //   case 'BottomRight':
  //     m.b = mv.b;
  //     m.r = mv.r;
  //     break;
  // }
  return m;
}

export const toRect = (size: Size): Rect => {
  return <Rect>{
    x: 0,
    y: 0,
    w: size.w,
    h: size.h
  }
}

export const getRect = (img: any): Rect => {
  return <Rect>{
    x: 0,
    y: 0,
    w: img.width||0,
    h: img.height||0
  }
}

/**
 * Trasla la forma da un contesto di dimensioni r ad uno di dimensioni tr
 * @param sh  shape
 * @param r   original rect
 * @param tr  target rect
 */
const translateShape = (sh: Shape, r: Rect, tr = DEFAULT_SVG_RECT): Shape => {
  const dw = tr.w / r.w;
  const dh = tr.h / r.h;
  return new Shape({
    tl: {x: (sh.tl.x * dw), y: (sh.tl.y * dh)},
    tr: {x: (sh.tr.x * dw), y: (sh.tr.y * dh)},
    br: {x: (sh.br.x * dw), y: (sh.br.y * dh)},
    bl: {x: (sh.bl.x * dw), y: (sh.bl.y * dh)},
  })
}

const moveShape = (sh: Shape, delta: Vector) => {
  sh.tl.x += delta.x;
  sh.tl.y += delta.y;
  sh.tr.x += delta.x;
  sh.tr.y += delta.y;
  sh.bl.x += delta.x;
  sh.bl.y += delta.y;
  sh.br.x += delta.x;
  sh.br.y += delta.y;
}

export const getAreaSize = (ele: HTMLDivElement, padding = 0): Size => {
  const r = ele.getBoundingClientRect();
  return <Size>{w: r.width - (2 * padding), h: r.height - (2 * padding)};
}

export const getAreaRect = (ele: HTMLDivElement, padding = 0): Rect => {
  const r = ele.getBoundingClientRect();
  return <Rect>{x: padding, y: padding, w: r.width - (2 * padding), h: r.height - (2 * padding)};
}

export const calcAreaPoints = (sh: Shape, ele: HTMLDivElement, padding = 0): string => {
  const ar = getAreaRect(ele, padding);
  const tsh = translateShape(sh, ar);
  return `${tsh.tl.x},${tsh.tl.y} ${tsh.tr.x},${tsh.tr.y} ${tsh.br.x},${tsh.br.y} ${tsh.bl.x},${tsh.bl.y}`;
}

export const calcPointMovement = (position: Shape,
                                  movement: Vector,
                                  point: CropPointPosition): Shape => {
  const mvm = <Shape>_clone(position);
  const v = <Vector>((<any>mvm) || {})[(<any>SHAPEPOINT)[point]];
  if (v) {
    v.x = movement.x;
    v.y = movement.y;
  }
  return mvm;
}


export const calcMovementA = (position: RectPos,
                      movement: Vector,
                      point: CropPointPosition,
                      ele: HTMLElement): RectPos => {
  const size = getSize(ele);
  const m = _clone(position);
  const mv: RectPos = {
    l: (movement.x - PADDING) / size.w,
    t: (movement.y - PADDING) / size.h,
    r: (size.w - (movement.x - PADDING)) / size.w,
    b: (size.h - (movement.y - PADDING)) / size.h
  }
  switch (point) {
    case 'TopLeft':
      m.t = mv.t
      m.l = mv.l;
      break;
    case 'TopRight':
      m.t = mv.t;
      m.r = mv.r;
      break;
    case 'BottomLeft':
      m.b = mv.b;
      m.l = mv.l;
      break;
    case 'BottomRight':
      m.b = mv.b;
      m.r = mv.r;
      break;
  }
  return m;
}

export const getCropRect = (cr: Rect, ele: HTMLElement): Rect => {
  const size = getSize(ele);
  console.log('CROP RECT', cr);
  console.log('IMAGE SIZE', size);

  return {
    x: (cr.x - PADDING) / size.w,
    y: (cr.y - PADDING) / size.h,
    w: cr.w / size.w,
    h: cr.h / size.h
  }
}

/**
 *  Risolve un sistema di equazioni lineari.
 *
 *  t1 = (a * r1) + (b + s1) + c
 *  t2 = (a * r2) + (b + s2) + c
 *  t3 = (a * r3) + (b + s3) + c
 *
 *  r1 - t3   valori noti.
 *  a, b, c   incognite.
 *  ritorna i coefficienti  a, b, c.
 */
const linearSolution = (r1: number, s1: number, t1: number,
                        r2: number, s2: number, t2: number,
                        r3: number, s3: number, t3: number): number[] => {
  const a = (((t2 - t3) * (s1 - s2)) - ((t1 - t2) * (s2 - s3))) / (((r2 - r3) * (s1 - s2)) - ((r1 - r2) * (s2 - s3)));
  const b = (((t2 - t3) * (r1 - r2)) - ((t1 - t2) * (r2 - r3))) / (((s2 - s3) * (r1 - r2)) - ((s1 - s2) * (r2 - r3)));
  const c = t1 - (r1 * a) - (s1 * b);

  return [a, b, c];
}

/**
 * Disegna un'area triangolare da un'immagine in un canvas
 *
 * s1-3  angoli dell'area triangolare dell'immagine
 * d1-3  angoli corrispondenti nel canvas di destinazione.
 *
 * @param img
 * @param ctx
 * @param s1
 * @param s2
 * @param s3
 * @param d1
 * @param d2
 * @param d3
 */
const drawImageTriangle = (img: any, ctx: CanvasRenderingContext2D,
                           s1: number[], s2: number[], s3: number[],
                           d1: number[], d2: number[], d3: number[]) => {
  const xm = linearSolution(s1[0], s1[1], d1[0], s2[0], s2[1], d2[0], s3[0], s3[1], d3[0]),
    ym = linearSolution(s1[0], s1[1], d1[1], s2[0], s2[1], d2[1], s3[0], s3[1], d3[1]);

  ctx.save();

  ctx.setTransform(xm[0], ym[0], xm[1], ym[1], xm[2], ym[2]);
  ctx.beginPath();
  ctx.moveTo(s1[0], s1[1]);
  ctx.lineTo(s2[0], s2[1]);
  ctx.lineTo(s3[0], s3[1]);
  ctx.closePath();
  //Leaves a faint black (or whatever .fillStyle) border around the drawn triangle
  //  ctx.fill();
  ctx.clip();
  ctx.drawImage(img, 0, 0, img.width, img.height);

  ctx.restore();
}

export class ShapeToCanvasCorrection {
  constructor(o?: Partial<ShapeToCanvasCorrection>) {
    Object.assign(this, o||{});
  }
  size = 500;
  cx = -30;
  cy = -30;
}

export const drawShapeToCanvas = (img: any, ctx: CanvasRenderingContext2D, crop: CropInfo, xcor?: Partial<ShapeToCanvasCorrection>) => {
  const cor = new ShapeToCanvasCorrection(xcor);

  // trasla la forma nel contesto dimensionale dell'immagine
  const img_rect = getRect(img);
  const area_rect = toRect(crop.area);
  const imgsh = translateShape(crop.shape, area_rect, img_rect);
  moveShape(imgsh, {x: cor.cx || 0, y: cor.cy || 0});

  // triangoli in cui è divisa l'immagine
  const img_tr1 = {p1: [imgsh.tl.x, imgsh.tl.y], p2: [imgsh.tr.x, imgsh.tr.y], p3: [imgsh.bl.x, imgsh.bl.y]};
  const img_tr2 = {p1: [imgsh.tr.x, imgsh.tr.y], p2: [imgsh.br.x, imgsh.br.y], p3: [imgsh.bl.x, imgsh.bl.y]};

  const dim = cor.size || 500;
  const ctx_tr1 = {p1: [0, 0], p2: [dim, 0], p3: [0, dim]};
  const ctx_tr2 = {p1: [dim, 0], p2: [dim, dim], p3: [0, dim]};

  drawImageTriangle(img, ctx, img_tr1.p1, img_tr1.p2, img_tr1.p3, ctx_tr1.p1, ctx_tr1.p2, ctx_tr1.p3);
  drawImageTriangle(img, ctx, img_tr2.p1, img_tr2.p2, img_tr2.p3, ctx_tr2.p1, ctx_tr2.p2, ctx_tr2.p3);
}
