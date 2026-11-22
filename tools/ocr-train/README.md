# OCR — addestramento classificatore cifre

CNN minuscola (~90k parametri) che classifica una cella 32x32 in 10 classi
(0 = vuota, 1..9). L'inferenza è in TypeScript puro
([libs/model/src/lib/ocr-digit-net.ts](../../libs/model/src/lib/ocr-digit-net.ts)),
quindi gira identica in browser, Web Worker e Node, senza dipendenze.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

## Flusso

```powershell
cd tools\ocr-train
.\.venv\Scripts\python generate.py          # dataset sintetico → data/
.\.venv\Scripts\python -u train.py          # addestra → apps/sudoku/public/ocr/digits.bin
cd ..\..
$env:SWC_NODE_PROJECT='tsconfig.base.json'
node -r @swc-node/register tools/ocr-train/eval.ts <foto> [attesi81]
```

- `synth.py` — generazione celle sintetiche dai font di Windows (linee di
  griglia disallineate, rumore, sfocatura, jpeg, frammenti di celle vicine).
- `generate.py` — dataset train/val (font separati, per misurare la
  generalizzazione) + `data/preview.png`.
- `train.py` — addestramento, export pesi binari (BatchNorm fuso), ONNX di
  riferimento, campioni per il test di parità TS↔PyTorch.
- `eval.ts` — test di parità + valutazione su foto reale con la stessa
  pipeline del server (`apps/api/src/app/ocr/ocr.digit-scan.ts`).

## Vincoli

- `synth.normalize` e `normalizeOcrCell` (TS) devono restare identiche.
- `DigitNet` (Python) e `OcrDigitNet` (TS) devono avere la stessa architettura.
