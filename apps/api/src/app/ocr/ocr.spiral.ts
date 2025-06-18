import { Pos, ScanContext } from '../../model/ocr.model';
import * as _ from 'lodash';
import { guid } from '@olmi/model';

export interface ImageMap {
  map: Pos[];
}

interface SpiralArgs extends ImageMap {
  // numero di cicli
  cycles: number;
  // inizializzato: ha identificato almeno un pixel attivo
  initialized: boolean;
  // ultima distanza dal centro che ha rilevato pixel
  lastPerimeter: number;
  // dimensione
  size: number;
  // distanza minima dal centro entro la quale deve essere determinato
  // alemno un pixel attivo perché la cella risulti valorizzata
  minH: number;
  // dizionario di insiemi di punti temporaneamente non contigui ai primari
  areas: any;
  // rappresenta il raggio d'azione massimo
  maxRadius: number;
  // rappresenta il raggio d'azione raggiunto
  radius: number;
  // colore mediano
  middleColor: number;
}


const isNextTo = (p1: Pos, p2: Pos): boolean => {
  return Math.abs(p1.x - p2.x) < 2 && Math.abs(p1.y - p2.y) < 2;
}

/**
 * vero se esiste almeno una pos attigua (adiacente su un lato o diagonale)
 * @param m
 * @param p
 */
const isNextToArea = (m: Pos[], p: Pos): boolean => !!m.find(np => isNextTo(np, p));

/**
 * aggiunge la posizione p ad una mappa attigua esistente se presente o ad una nuova
 * @param sp
 * @param p
 */
const addNextToMap = (sp: SpiralArgs, p: Pos): void => {
  const ak = _.keys(sp.areas).find(k => isNextToArea(sp.areas[k], p))||guid();
  sp.areas[ak] = sp.areas[ak] || [];
  sp.areas[ak].push({ ...p });
}

/**
 * verifica che la posizione p abbia annesso delle mappe attigue
 * @param sp
 * @param p
 */
const checkNextToMaps = (sp: SpiralArgs, p: Pos): void => {
  const aks = _.keys(sp.areas).filter(k => isNextToArea(sp.areas[k], p));
  aks.forEach(ak => {
    sp.map = _.uniq([...sp.map, ...sp.areas[ak]]);
    delete sp.areas[ak];
  });
  // TODO: da capire se l'aggiunta di una mappa extra incida sulla determinazione del "lastPerimeter"
}

const _calcRadius = (pos: Pos, origin: Pos): number => {
  const x = pos.x - origin.x;
  const y = pos.y - origin.y;
  return Math.sqrt((x*x)+(y*y));
}

const readPixel = (sp: SpiralArgs, ctx: ScanContext, pos: Pos, n: number) => {
  const clr = ctx.image.getPixelColor(pos.x, pos.y);
  const radius = _calcRadius(pos, { x: sp.size/2, y: sp.size/2 });
  if (sp.radius<radius) sp.radius = radius;
  const active = clr < sp.middleColor;
  // if (ctx.debug) console.log(`READ PIXEL (${pos.x},${pos.y}) active=${active},  color=`, clr);
  if (!(n%2)&&n>0) {
    sp.cycles++;
  }
  if (active) {
    if (!sp.initialized) {
      sp.initialized = true;
      sp.map.push({ ...pos });
    } else {
      // se il pixel è attiguo ad uno già presente in mappa
      // lo aggiunge direttamente alla amppa
      if (isNextToArea(sp.map, pos)) {
        sp.lastPerimeter = sp.cycles;
        sp.map.push({ ...pos });
        // verifica che l'aggiunta del nuovo pixel abbia annesso
        // delle mappe attigue presenti...
        checkNextToMaps(sp, pos);
      } else {
        // se non è attiguo lo aggiunge ad una delle mappe temporanee
        // presenti o ne crea una nuova
        addNextToMap(sp, pos);
      }
    }
  }
}

/**
 * Compie un semiciclo (incrementa o decrementa  x e y)
 * @param n
 * @param inc
 * @param pos
 * @param ctx
 * @param sp
 */
const semiCycle = (n: number, inc: boolean, pos: Pos, ctx: ScanContext, sp: SpiralArgs) => {
  ['x', 'y'].forEach(crd => {
    // if (ctx.debug) console.log(`run semiCycle (${crd})  da 0 < ${n}  con posizione iniziale`, pos);
    for (let i = 0; i < n; i++) {
      (<any>pos)[crd] = ((<any>pos)[crd] || 0) + (inc ? 1 : -1);
      readPixel(sp, ctx, pos, n);
    }
  });
}

/**
 * vero se lo scan di cella può essere terminato
 * @param sp
 * @param debug
 */
const isOver = (sp: SpiralArgs, debug = false): boolean => {

  const isover =
    // 1. dopo (H/2)/3 => cicli non ha rilevato alcun pixel attivo;
    (sp.cycles >= sp.minH && !sp.initialized) ||
    // 2. dopo 1 ciclo intero (se inizializzato) non ha trovato almeno 1 pixel attivo adiacente;
    (sp.initialized && (sp.lastPerimeter - sp.cycles) > 1) ||
    // fuori dai margini
    (sp.radius >= sp.maxRadius);

  if (debug) console.log(`isOver=${isover}`, sp);

  return isover;
}

/**
 * vero se lo scan di cella può essere terminato per la ricerca dello starter
 * @param sp
 * @param debug
 */
const isStarterOver = (sp: SpiralArgs, debug = false): boolean => {
  const isover =
    // 1. se inizializzato;
    (sp.initialized) ||
    // 1. dopo (H/2)/3 => cicli non ha rilevato alcun pixel attivo;
    (sp.cycles >= sp.minH) ||
    // fuori dai margini
    (sp.radius >= sp.maxRadius);

  if (debug) console.log(`Starter isOver=${isover}`, sp);

  return isover;
}


const _getSpiralArgs = (ctx: ScanContext, c?: Partial<SpiralArgs>): SpiralArgs => {
  return <SpiralArgs>{
    cycles: 0,
    size: ctx.image.height,
    minH: Math.floor(ctx.image.height / 4),
    maxRadius: Math.floor((ctx.image.height / 2) * Math.sqrt(2)),
    radius: 0,
    initialized: false,
    lastPerimeter: 0,
    map: [],
    middleColor: ctx.middleColor,
    areas: {},
    ...c
  };
}

/**
 * effettua l'aggregazione dei punti attivi secondo un percorso a
 * spirale dal centro verso la periferia dell'immagine
 * @param ctx
 * @param over
 */
const _spiral = (ctx: ScanContext, over: (args: SpiralArgs) => boolean) => {
  const a = _getSpiralArgs(ctx);
  const initial = Math.floor(ctx.image.width / 2) - 1;
  const pos = <Pos>{ x: initial, y: initial };
  // if (ctx.debug) console.log(`Init spiral ocr on image (${ctx.image.height}, ${ctx.image.width})`, spiral);
  let n = 0, inc = false;
  //   1. estrae il contenuto della cella
  readPixel(a, ctx, pos, n);
  do {
    inc = !inc;
    n++;
    semiCycle(n, inc, pos, ctx, a);
    // if (ctx.debug) console.log(`spiral ocr on ${n} cycle`, spiral);
  } while (!over(a));
  return a;
}


/**
 * ricerca dell'immagine dal nucleo
 * @param ctx
 */
export const spiralOcr = (ctx: ScanContext): Pos[] => {
  return _spiral(ctx, (args) => isOver(args, ctx.debug)).map
}

/**
 * ricerca il nucleo del carattere nell'immagine
 * @param ctx
 */
export const spiralSearchForStarter = (ctx: ScanContext): boolean => {
  const a = _spiral(ctx, (args) => isStarterOver(args, ctx.debug));
  ctx.starter = [...a.map];
  return a.initialized;
}
