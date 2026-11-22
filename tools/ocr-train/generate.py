"""
Genera il dataset sintetico in data/{train,val}.npz

uso: python generate.py [--train 120000] [--val 12000]
"""
import argparse
import os
import random
from multiprocessing import Pool

import numpy as np

import synth

EMPTY_RATIO = 0.15
_FONTS = None


def _init(fonts, seed):
    global _FONTS
    _FONTS = fonts
    s = (seed + os.getpid()) % (2 ** 31)
    random.seed(s)
    np.random.seed(s)


def _label():
    if random.random() < EMPTY_RATIO:
        return 0
    return random.randint(1, 9)


def _job(n):
    xs = np.empty((n, synth.CELL, synth.CELL), np.float32)
    ys = np.empty((n,), np.int64)
    for i in range(n):
        y = _label()
        xs[i] = synth.make_sample(y, _FONTS)
        ys[i] = y
    return xs, ys


def build(count, fonts, seed, chunk=2000):
    jobs = [chunk] * (count // chunk) + ([count % chunk] if count % chunk else [])
    with Pool(initializer=_init, initargs=(fonts, seed)) as pool:
        parts = pool.map(_job, jobs)
    x = np.concatenate([p[0] for p in parts])
    y = np.concatenate([p[1] for p in parts])
    return x, y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--train', type=int, default=120000)
    ap.add_argument('--val', type=int, default=12000)
    args = ap.parse_args()

    fonts = synth.load_fonts()
    print(f'fonts validi: {len(fonts)}')
    # font separati tra train e val per misurare la generalizzazione
    rnd = random.Random(42)
    shuffled = fonts[:]
    rnd.shuffle(shuffled)
    n_val = max(5, len(fonts) // 10)
    val_fonts, train_fonts = shuffled[:n_val], shuffled[n_val:]

    os.makedirs('data', exist_ok=True)
    x, y = build(args.train, train_fonts, 1)
    np.savez_compressed('data/train.npz', x=x, y=y)
    print('train', x.shape, np.bincount(y))
    x, y = build(args.val, val_fonts, 2)
    np.savez_compressed('data/val.npz', x=x, y=y)
    print('val', x.shape, np.bincount(y))

    # anteprima a griglia per controllo visivo
    from PIL import Image
    grid = (1 - x[:400].reshape(20, 20, 32, 32).transpose(0, 2, 1, 3).reshape(640, 640)) * 255
    Image.fromarray(grid.astype(np.uint8)).save('data/preview.png')


if __name__ == '__main__':
    main()
