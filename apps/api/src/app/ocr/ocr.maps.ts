import { JimpInstance, ResizeStrategy, Jimp } from 'jimp';
import * as _ from 'lodash';
import { OCR_MAP_POINT_SEPARATOR, OCR_MAP_SIZE, OcrMap, Pos, ScanContext, SizePos } from '../../model/ocr.model';
import { spiralSearchForStarter, spiralOcr } from './ocr.spiral';
import { nearOcr } from './ocr.near';
import { calcMiddleColor, findFirstNear, mapStringToArray, pidToPos, posToPid, traverseNear } from './ocr.helper';



// const OcrMap1: OcrMap = {"size":12,"text":"1","map":[{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":4,"y":1},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":1},{"x":3,"y":2},{"x":4,"y":2},{"x":5,"y":2},{"x":6,"y":2},{"x":7,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":6,"y":3},{"x":7,"y":3},{"x":6,"y":4},{"x":7,"y":4},{"x":6,"y":5},{"x":7,"y":5},{"x":6,"y":6},{"x":7,"y":6},{"x":6,"y":7},{"x":7,"y":7},{"x":6,"y":8},{"x":7,"y":8},{"x":6,"y":9},{"x":7,"y":9},{"x":6,"y":10},{"x":7,"y":10},{"x":6,"y":11},{"x":7,"y":11}]}
// const OcrMap2: OcrMap = {"size":12,"text":"2","map":[{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":3,"y":1},{"x":4,"y":1},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":3,"y":2},{"x":4,"y":2},{"x":7,"y":2},{"x":8,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":7,"y":3},{"x":8,"y":3},{"x":3,"y":4},{"x":4,"y":4},{"x":7,"y":4},{"x":8,"y":4},{"x":7,"y":5},{"x":8,"y":5},{"x":6,"y":6},{"x":7,"y":6},{"x":5,"y":7},{"x":6,"y":7},{"x":4,"y":8},{"x":5,"y":8},{"x":3,"y":9},{"x":4,"y":9},{"x":3,"y":10},{"x":4,"y":10},{"x":5,"y":10},{"x":6,"y":10},{"x":7,"y":10},{"x":8,"y":10},{"x":3,"y":11},{"x":4,"y":11},{"x":5,"y":11},{"x":6,"y":11},{"x":7,"y":11},{"x":8,"y":11}]};
// const OcrMap3: OcrMap = {"size":12,"text":"3","map":[{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":3,"y":1},{"x":4,"y":1},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":3,"y":2},{"x":4,"y":2},{"x":7,"y":2},{"x":8,"y":2},{"x":7,"y":3},{"x":8,"y":3},{"x":7,"y":4},{"x":8,"y":4},{"x":4,"y":5},{"x":5,"y":5},{"x":6,"y":5},{"x":7,"y":5},{"x":4,"y":6},{"x":5,"y":6},{"x":6,"y":6},{"x":7,"y":6},{"x":7,"y":7},{"x":8,"y":7},{"x":7,"y":8},{"x":8,"y":8},{"x":3,"y":9},{"x":4,"y":9},{"x":7,"y":9},{"x":8,"y":9},{"x":3,"y":10},{"x":4,"y":10},{"x":5,"y":10},{"x":6,"y":10},{"x":7,"y":10},{"x":8,"y":10},{"x":4,"y":11},{"x":5,"y":11},{"x":6,"y":11},{"x":7,"y":11}]};
// const OcrMap4: OcrMap = {"size":12,"text":"4","map":[{"x":7,"y":0},{"x":8,"y":0},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":5,"y":2},{"x":6,"y":2},{"x":7,"y":2},{"x":8,"y":2},{"x":4,"y":3},{"x":5,"y":3},{"x":6,"y":3},{"x":7,"y":3},{"x":8,"y":3},{"x":4,"y":4},{"x":5,"y":4},{"x":7,"y":4},{"x":8,"y":4},{"x":3,"y":5},{"x":4,"y":5},{"x":7,"y":5},{"x":8,"y":5},{"x":2,"y":6},{"x":3,"y":6},{"x":4,"y":6},{"x":7,"y":6},{"x":8,"y":6},{"x":2,"y":7},{"x":3,"y":7},{"x":4,"y":7},{"x":5,"y":7},{"x":6,"y":7},{"x":7,"y":7},{"x":8,"y":7},{"x":9,"y":7},{"x":2,"y":8},{"x":3,"y":8},{"x":4,"y":8},{"x":5,"y":8},{"x":6,"y":8},{"x":7,"y":8},{"x":8,"y":8},{"x":9,"y":8},{"x":7,"y":9},{"x":8,"y":9},{"x":7,"y":10},{"x":8,"y":10},{"x":7,"y":11},{"x":8,"y":11}]};
// const OcrMap4_1: OcrMap = {"size":12,"text":"4","map":[{"x":7,"y":0},{"x":8,"y":0},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":6,"y":2},{"x":7,"y":2},{"x":5,"y":3},{"x":6,"y":3},{"x":4,"y":4},{"x":5,"y":4},{"x":3,"y":5},{"x":4,"y":5},{"x":5,"y":5},{"x":3,"y":6},{"x":4,"y":6},{"x":7,"y":6},{"x":8,"y":6},{"x":2,"y":7},{"x":3,"y":7},{"x":4,"y":7},{"x":7,"y":7},{"x":8,"y":7},{"x":2,"y":8},{"x":3,"y":8},{"x":4,"y":8},{"x":5,"y":8},{"x":6,"y":8},{"x":7,"y":8},{"x":8,"y":8},{"x":9,"y":8},{"x":2,"y":9},{"x":3,"y":9},{"x":4,"y":9},{"x":5,"y":9},{"x":6,"y":9},{"x":7,"y":9},{"x":8,"y":9},{"x":9,"y":9},{"x":7,"y":10},{"x":8,"y":10},{"x":7,"y":11},{"x":8,"y":11}]};
// const OcrMap5: OcrMap = {"size":12,"text":"5","map":[{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":8,"y":0},{"x":3,"y":1},{"x":4,"y":1},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":3,"y":2},{"x":4,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":3,"y":4},{"x":4,"y":4},{"x":3,"y":5},{"x":4,"y":5},{"x":5,"y":5},{"x":6,"y":5},{"x":4,"y":6},{"x":5,"y":6},{"x":6,"y":6},{"x":7,"y":6},{"x":7,"y":7},{"x":8,"y":7},{"x":7,"y":8},{"x":8,"y":8},{"x":7,"y":9},{"x":8,"y":9},{"x":3,"y":10},{"x":4,"y":10},{"x":5,"y":10},{"x":6,"y":10},{"x":7,"y":10},{"x":8,"y":10},{"x":3,"y":11},{"x":4,"y":11},{"x":5,"y":11},{"x":6,"y":11},{"x":7,"y":11}]};
// const OcrMap6: OcrMap = {"size":12,"text":"6","map":[{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":3,"y":1},{"x":4,"y":1},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":3,"y":2},{"x":4,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":3,"y":4},{"x":4,"y":4},{"x":3,"y":5},{"x":4,"y":5},{"x":5,"y":5},{"x":6,"y":5},{"x":7,"y":5},{"x":3,"y":6},{"x":4,"y":6},{"x":5,"y":6},{"x":6,"y":6},{"x":7,"y":6},{"x":8,"y":6},{"x":3,"y":7},{"x":4,"y":7},{"x":7,"y":7},{"x":8,"y":7},{"x":3,"y":8},{"x":4,"y":8},{"x":7,"y":8},{"x":8,"y":8},{"x":3,"y":9},{"x":4,"y":9},{"x":7,"y":9},{"x":8,"y":9},{"x":3,"y":10},{"x":4,"y":10},{"x":5,"y":10},{"x":6,"y":10},{"x":7,"y":10},{"x":8,"y":10},{"x":4,"y":11},{"x":5,"y":11},{"x":6,"y":11},{"x":7,"y":11}]};
// const OcrMap7: OcrMap = {"size":12,"text":"7","map":[{"x":3,"y":0},{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":8,"y":0},{"x":3,"y":1},{"x":4,"y":1},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":7,"y":2},{"x":8,"y":2},{"x":7,"y":3},{"x":8,"y":3},{"x":7,"y":4},{"x":8,"y":4},{"x":6,"y":5},{"x":7,"y":5},{"x":6,"y":6},{"x":7,"y":6},{"x":5,"y":7},{"x":6,"y":7},{"x":4,"y":8},{"x":5,"y":8},{"x":6,"y":8},{"x":4,"y":9},{"x":5,"y":9},{"x":4,"y":10},{"x":5,"y":10},{"x":4,"y":11},{"x":5,"y":11}]};
// const OcrMap8: OcrMap = {"size":12,"text":"8","map":[{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":3,"y":1},{"x":4,"y":1},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":3,"y":2},{"x":4,"y":2},{"x":7,"y":2},{"x":8,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":7,"y":3},{"x":8,"y":3},{"x":3,"y":4},{"x":4,"y":4},{"x":7,"y":4},{"x":8,"y":4},{"x":4,"y":5},{"x":5,"y":5},{"x":6,"y":5},{"x":7,"y":5},{"x":4,"y":6},{"x":5,"y":6},{"x":6,"y":6},{"x":7,"y":6},{"x":3,"y":7},{"x":4,"y":7},{"x":7,"y":7},{"x":8,"y":7},{"x":3,"y":8},{"x":4,"y":8},{"x":7,"y":8},{"x":8,"y":8},{"x":3,"y":9},{"x":4,"y":9},{"x":7,"y":9},{"x":8,"y":9},{"x":3,"y":10},{"x":4,"y":10},{"x":5,"y":10},{"x":6,"y":10},{"x":7,"y":10},{"x":8,"y":10},{"x":4,"y":11},{"x":5,"y":11},{"x":6,"y":11},{"x":7,"y":11}]};
// const OcrMap9: OcrMap = {"size":12,"text":"9","map":[{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":3,"y":1},{"x":4,"y":1},{"x":5,"y":1},{"x":6,"y":1},{"x":7,"y":1},{"x":8,"y":1},{"x":3,"y":2},{"x":4,"y":2},{"x":7,"y":2},{"x":8,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":7,"y":3},{"x":8,"y":3},{"x":3,"y":4},{"x":4,"y":4},{"x":7,"y":4},{"x":8,"y":4},{"x":4,"y":5},{"x":5,"y":5},{"x":6,"y":5},{"x":7,"y":5},{"x":8,"y":5},{"x":4,"y":6},{"x":5,"y":6},{"x":6,"y":6},{"x":7,"y":6},{"x":8,"y":6},{"x":7,"y":7},{"x":8,"y":7},{"x":7,"y":8},{"x":8,"y":8},{"x":7,"y":9},{"x":8,"y":9},{"x":3,"y":10},{"x":4,"y":10},{"x":5,"y":10},{"x":6,"y":10},{"x":7,"y":10},{"x":8,"y":10},{"x":4,"y":11},{"x":5,"y":11},{"x":6,"y":11},{"x":7,"y":11}]};
//
// /**
//  * Mappe statiche delle cifre
//  */
// const OcrMaps: OcrMap[] = [
//   OcrMap1,
//   OcrMap2,
//   OcrMap3,
//   OcrMap4,
//   OcrMap4_1,
//   OcrMap5,
//   OcrMap6,
//   OcrMap7,
//   OcrMap8,
//   OcrMap9,
// ]

export interface ScanResult {
  map?: OcrMap;
  // punti dell'immagine sulla mappa
  covered: number;
  // punti dell'immagine fuori dalla mappa
  discovered: number;
  // punti della mappa non utilizzati
  coverout: number;
  // totale punti
  total: number;
  /**
   * match totale che ttiene conto sia dei punti interni alla
   * mappa che di quelli esterni
   */
  match: number;
}

/**
 * crea la mappa confrontabile (12x12) a partire dall'immagine
 * @param om
 * @param middleColor
 */
export const getOcrImageMap = (om: OcrMap, middleColor: number): OcrMap => {
  //const options = { w: OCR_MAP_SIZE, h: OCR_MAP_SIZE, mode: ResizeStrategy.BICUBIC };
  // rigenera l'immagine 24x24
  const img = <any>getMapImage(om);
  // la ridimensiona a 12x12
  // img.resize(options);
  const positions: Pos[] = [];
  const h = img.height, w = img.width;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const clr = img.getPixelColor(x, y);
      const active = clr < middleColor;
      if (active) positions.push(<Pos>{ x, y });
    }
  }
  return <OcrMap>{
    map: positions.map(p => posToPid(p)).join(OCR_MAP_POINT_SEPARATOR),
    size: OCR_MAP_SIZE,
    text: ''
  };
}

/**
 *
 * @param ctx
 * @param m
 */
const _scan = (ctx: ScanContext, m: OcrMap): ScanResult => {
  const options = { w: OCR_MAP_SIZE, h: OCR_MAP_SIZE, mode: ResizeStrategy.BICUBIC };
  const img: any = ctx.image.clone();
  img.resize(options);
  const res = <ScanResult>{
    total: 0,
    discovered: 0,
    covered: 0,
    map: m,
    match: 0
  };
  if (ctx.debug) console.log(`\n>>>>>>>>>>>>>>>>>>> MAPPA ${m.text}`, m.map);
  // verifica la copertura di ogni punto sulla mappa
  const h = img.height, w = img.width;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const clr = img.getPixelColor(x, y);
      const active = clr < ctx.middleColor;
      if (active) {
        res.total++;
        const pid = posToPid({ x, y });
        const map = mapStringToArray(m.map);
        let map_cell: string|undefined = map.find(m => m === pid);
        if (!map_cell) map_cell = findFirstNear(map_cell, map);
        if (ctx.debug) console.log(`source active point (${x},${y}), target cell:`, map_cell);
        if (map_cell) {
          res.covered++;
        } else {
          res.discovered++;
        }
      }
    }
  }
  // un match è considerato valido (>0) se la copertura supera il 50% dei punti
  const real_match = (res.covered > res.discovered) ? res.covered - res.discovered : 0;
  // il valore del matcxh tiene conto dei punti non coperti
  res.match = Math.floor((real_match / res.covered) * 100);
  if (ctx.debug) console.log(`${m.text} match result ${res.match}%   (cov=${res.covered}  dis=${res.discovered})`);
  return res;
}


const _includesOrNear = (m: string[], pid: string): boolean => {
  return m.includes(pid) || !!findFirstNear(pid, m);
}

/**
 * confronta le mappe 12x12
 * @param om
 * @param ref
 * @param debug
 */
export const _compareMap12 = (om: OcrMap, ref: OcrMap, debug = false): ScanResult => {
  const ref_map = ref.map.split(OCR_MAP_POINT_SEPARATOR);
  const m = om.map.split(OCR_MAP_POINT_SEPARATOR);
  const res = <ScanResult>{
    total: 0,
    discovered: 0,
    covered: 0,
    coverout: 0,
    map: { ...om, text: ref.text },
    match: 0
  };
  for (let y = 0; y < OCR_MAP_SIZE; y++) {
    for (let x = 0; x < OCR_MAP_SIZE; x++) {
      const pid = posToPid({ x, y });
      if (ref_map.includes(pid)) {
        if (_includesOrNear(m, pid)) {
          res.covered++;
        } else {
          res.coverout++;
        }
      } else if (m.includes(pid)) {
        res.discovered++;
      }
    }
  }
  const real_match = (res.covered > res.discovered) ? res.covered - res.discovered : 0;
  const real_out = (real_match > 0) ? res.coverout : 0;
  // il valore del matcxh tiene conto dei punti non coperti sia della matrice che della cella
  res.match = Math.floor(((real_match - real_out) / res.covered) * 100);
  if (debug) console.log(`${ref.text} match result ${res.match}%   (cov=${res.covered}  dis=${res.discovered}  out=${res.coverout})`);
  return res;
}


/**
 * ricerca la mappa che più si adatta all'immagine passata
 * @param ctx
 */
export const scanOnMap = (ctx: ScanContext): ScanResult|undefined => {
  const comp_res = (ctx.maps||[]).map(m => _compareMap12(ctx.ocrMap, m));
  const res: ScanResult|undefined = _.maxBy(comp_res, 'match');
  if (ctx.debug) {
    if (res) {
      console.log(`match result "${res.map?.text || '?'}" (${res.match || 0}%)   (cov=${res.covered}  dis=${res.discovered})`);
    } else {
      console.log(`no match result`);
    }
  }
  return res;
}

const _getBounds = (mm: Pos[]): SizePos => {
  const sp = <SizePos>{ x:0, y:0, w:0, h:0, r:0, b:0 };
  mm.forEach(m => {
    if (sp.x <= 0 || m.x < sp.x) sp.x = m.x;
    if (sp.y <= 0 || m.y < sp.y) sp.y = m.y;
    if (m.x > sp.r) sp.r = m.x;
    if (m.y > sp.b) sp.b = m.y;
  });
  sp.w = sp.r - sp.x + 1;
  sp.h = sp.b - sp.y + 1;
  return sp;
}

/**
 * crea una cella quadrata dove centra la mappa utilizzando la dimensione maggiore
 * @param m
 * @param bounds
 */
const _setMinQuadSize = (m: Pos[], bounds: SizePos): SizePos => {
  let dx: number, dy: number, size: number;
  if (bounds.w > bounds.h) {
    // larghezza maggiore
    size = bounds.w;
    dx = bounds.x;
    dy = bounds.y - Math.floor((size - bounds.h) / 2);
  } else {
    // altezza maggiore
    size = bounds.h;
    dx = bounds.x - Math.floor((size - bounds.w) / 2);
    dy = bounds.y;
  }
  // centra sulla dimensione minore porttando a zero la maggiore
  m.forEach(p => {
    p.x = p.x - dx;
    p.y = p.y - dy;
  });
  return <SizePos>{ x: 0, y: 0, w: size, h: size, r: size - 1, b: size - 1 }
}

/**
 * ogni punto nel buffer è generato da quelli della mappa
 * @param m
 * @param bounds
 */
const _getMapBuffer = (m: Pos[], bounds: SizePos): number[] => {
  const buffer: number[] = [];
  for (let y = 0; y < bounds.h; y++) {
    for (let x = 0; x < bounds.w; x++) {
      const v = m.find(p => p.x===x && p.y===y);
      const p = v ? 0x000000ff : 0xffffffff;
      buffer.push(p);
    }
  }
  return buffer;
}

/**
 * costruisce l'immagine di cella senza bordo effettuando uno scan a
 * spirale dal centro. Il risultato è una bitmap con una palette limitata a 2 colori
 * (bianco e nero) che inscrive centrandolo il contenuto della cella in un quadrato
 * @param ctx
 */
export const buildCellMap = (ctx: ScanContext): OcrMap|undefined => {
  ctx.middleColor = calcMiddleColor(ctx);

  // 1. determina il contenuto della cella
  let cellMap: Pos[];
  switch (ctx.mode) {
    case 'spiral':
      cellMap = spiralOcr(ctx);
      break;
    default:
      // se la ricerca del nucleo fallisce la cella viene
      // interpretata come non valorizzata
      if (!spiralSearchForStarter(ctx)) return undefined;
      // console.log(`STARTER LOADED`, ctx.starter);
      cellMap = nearOcr(ctx);
      break;
  }
  if ((cellMap || []).length <= 0) return undefined;

  const bounds = _getBounds(cellMap);
  // if (ctx.debug) console.log('CELL BOUNDS', bounds);
  const new_bounds = _setMinQuadSize(cellMap, bounds);
  // if (ctx.debug) console.log('CELL NEW BOUNDS', new_bounds);

  if (ctx.debug) console.log('FINAL CELL MAP', cellMap);

  return <OcrMap>{
    map: cellMap.map(p => posToPid(p)).join(OCR_MAP_POINT_SEPARATOR),
    size: new_bounds.w,
    text: ''
  }
}


export const getMapImage = (om: OcrMap): JimpInstance => {
  const res = new Jimp({
    width: om.size,
    height: om.size,
    color: 0xFFFFFFFF
  });
  mapStringToArray(om.map).forEach(pid => {
    const p = pidToPos(pid);
    res.setPixelColor(0x000000FF, p.x,p.y);
  });
  return <JimpInstance>res;
}
