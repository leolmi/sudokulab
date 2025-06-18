import { keys as _keys } from 'lodash';
import { JimpInstance } from 'jimp';
import { pidToPos, posToPid, traverseNear } from './ocr.helper';
import { Pos, ScanContext } from '../../model/ocr.model';

interface NearArgs {
  // immagine
  image: JimpInstance;
  // dimensione
  size: number;
  // colore mediano
  middleColor: number;
  // mappa dei punti
  map: any;
  // debug
  debug: boolean;
}

const _isOver = (args: NearArgs, p: Pos): boolean => {
  const isover = p.x >= args.size || p.x <= 0 || p.y > args.size || p.y <= 0;
  // if (isover) console.log(`POINT (${posToPid(p)}) is over (size=${args.size})`);
  return isover;
}


const _expandNear = (args: NearArgs, p: Pos): void => {
  if (p?.x) {
    if (args.debug) console.group(`expand near on point`, p);
    const opid = posToPid(p);
    traverseNear(p, (pos, pid) => {
      if (pid !== opid && !args.map[pid] && !_isOver(args, pos)) {
        const clr = args.image.getPixelColor(pos.x, pos.y);
        if (clr < args.middleColor) {
          if (args.debug) console.log(`point (${pid}) loaded, expand from here`)
          args.map[pid] = true;
          _expandNear(args, pos);
        } else {
          if (args.debug) console.log(`point (${pid}) discarded, clr=${clr} (<${args.middleColor})`)
        }
      } else {
        if (args.debug) console.log(`point (${pid}) skipped`);
      }
    });
    if (args.debug) console.groupEnd()
  }
}

const _getNearArgs = (ctx: ScanContext): NearArgs => {
  const args = <NearArgs>{
    image: ctx.image,
    size: ctx.image.height,
    middleColor: ctx.middleColor,
    map: {},
    debug: ctx.debug
  };
  (ctx.starter||[]).forEach(p => args.map[posToPid(p)] = true);
  return args;
}

/**
 * crea la figura attraverso tutti i punti "vicini"
 * @param ctx
 */
export const nearOcr = (ctx: ScanContext): Pos[] => {
  const args = _getNearArgs(ctx);
  // console.log('NEAR OCR ARGS', args);
  for(const p of ctx.starter) {
    _expandNear(args, p);
  }
  return _keys(args.map).map(k => pidToPos(k));
}
