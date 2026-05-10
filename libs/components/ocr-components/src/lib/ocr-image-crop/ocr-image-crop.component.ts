import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { getQuad, Pos, Quad } from '@olmi/model';

interface CropPoint extends Pos {
  id: string;
}

@Component({
  selector: 'ocr-image-crop',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './ocr-image-crop.component.html',
  styleUrl: './ocr-image-crop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrImageCropComponent {
  readonly image = input<string | null | undefined>('');
  readonly cropQuad = output<Quad>();

  protected readonly desktop = viewChild<ElementRef<SVGSVGElement>>('desktop');

  protected readonly points = signal<CropPoint[]>([
    { x: 10, y: 10, id: 'A' },
    { x: 30, y: 10, id: 'B' },
    { x: 30, y: 30, id: 'C' },
    { x: 10, y: 30, id: 'D' },
  ]);
  protected readonly dragging = signal<string>('');

  protected readonly polygonPoints = computed(() => {
    const q = getQuad(this.points());
    return `${q.tl.x},${q.tl.y} ${q.tr.x},${q.tr.y} ${q.br.x},${q.br.y} ${q.bl.x},${q.bl.y}`;
  });

  constructor() {
    effect(() => this.cropQuad.emit(getQuad(this.points())));
  }

  private _updatePoint(cp: CropPoint) {
    const svg = this.desktop()?.nativeElement;
    if (!svg) return;
    const pp = svg.createSVGPoint();
    pp.x = cp.x;
    pp.y = cp.y;
    const np = pp.matrixTransform(svg.getScreenCTM()?.inverse());
    this.points.update(pnts => pnts.map(p => p.id === cp.id ? { ...p, x: np.x, y: np.y } : p));
  }

  dragThis(pnt?: CropPoint) {
    this.dragging.set(pnt?.id || '');
  }

  dragCropPoint(e: MouseEvent) {
    const id = this.dragging();
    if (!id) return;
    this._updatePoint({ id, x: e.clientX, y: e.clientY });
  }

  touchCropPoint(e: TouchEvent) {
    const id = this.dragging();
    if (!id) return;
    const touch = e.touches[0];
    if (!touch) return;
    this._updatePoint({ id, x: touch.clientX, y: touch.clientY });
  }
}
