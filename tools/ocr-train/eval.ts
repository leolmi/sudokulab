/**
 * Valutazione dell'OCR su foto reali + test di parità TS↔PyTorch.
 * Usa la stessa pipeline del server (apps/api/src/app/ocr/ocr.digit-scan.ts).
 *
 * uso (dalla root del repo, PowerShell):
 *   $env:SWC_NODE_PROJECT='tsconfig.base.json'
 *   node -r @swc-node/register tools/ocr-train/eval.ts <immagine> [attesi(81)]
 */
import * as fs from 'fs';
import * as path from 'path';
import { OcrDigitNet } from '@olmi/model';
import { OCR_DOUBT_CONFIDENCE, scanImage } from '../../apps/api/src/app/ocr/ocr.digit-scan';

const DATA = path.join(process.cwd(), 'tools', 'ocr-train', 'data');
const WEIGHTS = path.join(process.cwd(), 'apps/sudoku/public/ocr/digits.bin');

const toArrayBuffer = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

function parity() {
  const fx = path.join(DATA, 'parity_x.f32'), fp = path.join(DATA, 'parity_p.f32');
  if (!fs.existsSync(fx)) return console.log('parità: file di riferimento assenti, salto');
  const net = new OcrDigitNet(toArrayBuffer(fs.readFileSync(WEIGHTS)));
  const x = new Float32Array(toArrayBuffer(fs.readFileSync(fx)));
  const p = new Float32Array(toArrayBuffer(fs.readFileSync(fp)));
  const q = net.predict(x);
  let maxErr = 0;
  for (let i = 0; i < p.length; i++) maxErr = Math.max(maxErr, Math.abs(p[i] - q[i]));
  console.log(`parità TS vs PyTorch: errore max ${maxErr.toExponential(2)} su ${p.length / 10} celle`);
}

async function main() {
  const [imgPath, expected] = process.argv.slice(2);
  parity();
  if (!imgPath) return;

  const { result, predictions, gridFound, times } = await scanImage(fs.readFileSync(imgPath));
  console.log(`griglia trovata: ${gridFound}`);
  for (let r = 0; r < 9; r++) {
    console.log(predictions.slice(r * 9, r * 9 + 9)
      .map(p => (p.value || '.') + (p.confidence < OCR_DOUBT_CONFIDENCE ? '?' : ' ')).join(' '));
  }
  console.log('valori', result.values);
  const ms = (v: number) => `${v.toFixed(0)}ms`;
  console.log(`tempi: decode ${ms(times.decode)}, detect ${ms(times.detect)}, warp+norm ${ms(times.warp)}, rete ${ms(times.net)}`);
  result.doubts.forEach(d => console.log(`  incerta r${d.cell!.y + 1}c${d.cell!.x + 1}: ${d.map}`));

  if (expected?.length === 81) {
    const errs = [...expected].map((e, i) => ({ i, e, v: result.values[i] })).filter(x => x.e !== x.v);
    console.log(`accuratezza: ${81 - errs.length}/81`);
    errs.forEach(x => console.log(`  errore r${Math.floor(x.i / 9) + 1}c${x.i % 9 + 1}: atteso ${x.e}, letto ${x.v}`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
