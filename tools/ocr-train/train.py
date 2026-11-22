"""
Addestra la CNN delle cifre ed esporta il modello ONNX per il client.

uso: python train.py [--epochs 12] [--out ../../apps/sudoku/public/ocr/digits.onnx]

Input modello:  float32 [N, 1, 32, 32]  (inchiostro normalizzato, vedi synth.normalize)
Output modello: float32 [N, 10]         (probabilità: 0 = vuota, 1..9 = cifra)
"""
import argparse
import os
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


def block(i, o):
    return [nn.Conv2d(i, o, 3, padding=1, bias=False), nn.BatchNorm2d(o), nn.ReLU(inplace=True)]


class DigitNet(nn.Module):
    """
    Rete volutamente piccola (~2.5M MAC per cella): l'inferenza lato client è
    in TypeScript puro (libs/model/src/lib/ocr-digit-net.ts), che replica
    esattamente questa architettura.
    """
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            *block(1, 16), nn.MaxPool2d(2),   # 16x16
            *block(16, 32), nn.MaxPool2d(2),  # 8x8
            *block(32, 64), nn.MaxPool2d(2),  # 4x4
        )
        self.head = nn.Sequential(
            nn.Flatten(), nn.Dropout(0.3),
            nn.Linear(64 * 16, 64), nn.ReLU(inplace=True),
            nn.Linear(64, 10),
        )

    def forward(self, x):
        return self.head(self.features(x))


class WithSoftmax(nn.Module):
    def __init__(self, net):
        super().__init__()
        self.net = net

    def forward(self, x):
        return F.softmax(self.net(x), dim=1)


MAGIC = 0x444B4453  # 'SDKD'


def export_bin(model, path):
    """
    Pesi in formato binario little-endian per il runtime TypeScript, con
    BatchNorm fuso nelle convoluzioni.
    header: magic u32, version u32, count u32
    tensore: ndim u32, dims u32[ndim], data f32[prod(dims)]
    ordine: conv1.w conv1.b conv2.w conv2.b conv3.w conv3.b fc1.w fc1.b fc2.w fc2.b
    """
    tensors = []
    mods = list(model.features)
    for i, m in enumerate(mods):
        if isinstance(m, nn.Conv2d):
            bn = mods[i + 1]
            scale = bn.weight / torch.sqrt(bn.running_var + bn.eps)
            w = m.weight * scale[:, None, None, None]
            b = bn.bias - bn.running_mean * scale
            tensors += [w, b]
    for m in model.head:
        if isinstance(m, nn.Linear):
            tensors += [m.weight, m.bias]
    with open(path, 'wb') as f:
        f.write(np.array([MAGIC, 1, len(tensors)], '<u4').tobytes())
        for t in tensors:
            a = t.detach().cpu().numpy().astype('<f4')
            f.write(np.array([a.ndim, *a.shape], '<u4').tobytes())
            f.write(a.tobytes())


def load(path):
    d = np.load(path)
    return torch.from_numpy(d['x']).unsqueeze(1), torch.from_numpy(d['y'])


def shift(x):
    """Traslazione casuale ±2px (augment economico a runtime)."""
    dx, dy = np.random.randint(-2, 3, 2)
    return torch.roll(x, shifts=(int(dy), int(dx)), dims=(2, 3))


def evaluate(model, x, y, bs=1024):
    model.eval()
    correct = 0
    conf = np.zeros((10, 10), np.int64)
    with torch.no_grad():
        for i in range(0, len(x), bs):
            p = model(x[i:i + bs]).argmax(1)
            correct += (p == y[i:i + bs]).sum().item()
            for t, q in zip(y[i:i + bs].tolist(), p.tolist()):
                conf[t, q] += 1
    return correct / len(x), conf


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--epochs', type=int, default=12)
    ap.add_argument('--bs', type=int, default=256)
    ap.add_argument('--out', default='../../apps/sudoku/public/ocr/digits.bin')
    ap.add_argument('--onnx', default='data/digits.onnx')
    args = ap.parse_args()

    torch.manual_seed(0)
    xt, yt = load('data/train.npz')
    xv, yv = load('data/val.npz')
    print(f'train {len(xt)}  val {len(xv)}')

    model = DigitNet()
    print('parametri:', sum(p.numel() for p in model.parameters()))
    opt = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
    steps = args.epochs * ((len(xt) + args.bs - 1) // args.bs)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-3, total_steps=steps)

    best = 0.0
    for ep in range(args.epochs):
        model.train()
        t0 = time.time()
        perm = torch.randperm(len(xt))
        tot = 0.0
        for i in range(0, len(xt), args.bs):
            idx = perm[i:i + args.bs]
            xb, yb = shift(xt[idx]), yt[idx]
            loss = F.cross_entropy(model(xb), yb, label_smoothing=0.05)
            opt.zero_grad()
            loss.backward()
            opt.step()
            sched.step()
            tot += loss.item() * len(idx)
        acc, _ = evaluate(model, xv, yv)
        print(f'ep {ep + 1:2d}  loss {tot / len(xt):.4f}  val {acc * 100:.2f}%  ({time.time() - t0:.0f}s)')
        if acc >= best:
            best = acc
            torch.save(model.state_dict(), 'data/best.pt')

    model.load_state_dict(torch.load('data/best.pt'))
    acc, conf = evaluate(model, xv, yv)
    print(f'best val {acc * 100:.2f}%\nconfusione (righe=vero, colonne=predetto):\n{conf}')

    model.eval()
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    export_bin(model, args.out)
    print('esportato', args.out, os.path.getsize(args.out), 'bytes')

    # ONNX di riferimento (verifica del runtime TS / futuro uso con onnxruntime)
    torch.onnx.export(
        WithSoftmax(model).eval(), torch.zeros(1, 1, 32, 32), args.onnx,
        input_names=['input'], output_names=['probs'],
        dynamic_axes={'input': {0: 'n'}, 'probs': {0: 'n'}},
        opset_version=17, dynamo=False,
    )
    print('esportato', args.onnx, os.path.getsize(args.onnx), 'bytes')

    # campioni di riferimento per il test di parità TS
    with torch.no_grad():
        ref = WithSoftmax(model).eval()(xv[:16]).numpy()
    xv[:16].numpy().astype('<f4').tofile('data/parity_x.f32')
    ref.astype('<f4').tofile('data/parity_p.f32')


if __name__ == '__main__':
    main()
