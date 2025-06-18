import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, combineLatest, filter, map, Observable } from 'rxjs';
import { getQuad, Pos, Quad } from '@olmi/model';
import { cloneDeep as _clone } from 'lodash';

interface CropPoint extends Pos {
  id: string;
}

@Component({
  selector: 'ocr-image-crop',
  imports: [
    CommonModule,
    FlexModule,
    MatButtonModule,
  ],
  templateUrl: './ocr-image-crop.component.html',
  styleUrl: './ocr-image-crop.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcrImageCropComponent {
  @ViewChild('desktop') set desktop(d: ElementRef) {
    this._desktop$.next(<SVGSVGElement>d.nativeElement);
  };
  private _drag$: BehaviorSubject<CropPoint|undefined>;
  private _desktop$: BehaviorSubject<SVGSVGElement|undefined>;
  points$: BehaviorSubject<CropPoint[]>
  poligonPoints$: Observable<string>;
  dragging$: BehaviorSubject<string>;

  @Input()
  image: string|null|undefined = '';

  @Output()
  cropQuad: EventEmitter<Quad> = new EventEmitter<Quad>();

  constructor() {
    this.dragging$ = new BehaviorSubject<string>('');
    this._desktop$ = new BehaviorSubject<SVGSVGElement | undefined>(undefined);
    this._drag$ = new BehaviorSubject<CropPoint|undefined>(undefined);

    this.points$ = new BehaviorSubject<CropPoint[]>([
      { x: 10, y: 10, id: 'A' },
      { x: 30, y: 10, id: 'B' },
      { x: 30, y: 30, id: 'C' },
      { x: 10, y: 30, id: 'D' }
    ]);

    this.poligonPoints$ = this.points$.pipe(map(pnts => {
      const q = getQuad(pnts);
      return `${q.tl.x},${q.tl.y} ${q.tr.x},${q.tr.y} ${q.br.x},${q.br.y} ${q.bl.x},${q.bl.y}`;
    }));

    this.points$.subscribe(pnts => this.cropQuad.emit(getQuad(pnts)));

    combineLatest([this._drag$, this.dragging$])
      .pipe(filter(([drag, did]) => !!did && !!drag && drag.id === did))
      .subscribe(([drag, ding]) => drag ? this.updatePoint(drag) : null);
  }

  updatePoint(cp: CropPoint) {
    const svg = this._desktop$.value;
    if (!svg) return;
    const pp = svg.createSVGPoint();
    pp.x = cp.x;
    pp.y = cp.y;
    const np = pp.matrixTransform(svg.getScreenCTM()?.inverse());
    const pnts = _clone(this.points$.value);
    const xp = pnts.find(p => p.id === cp.id);
    if (xp) {
      console.log(`POINT MOVE FROM [${xp.x},${xp.y}] TO [${np.x},${np.x}]`);
      xp.x = np.x;
      xp.y = np.y;
      this.points$.next(pnts);
    }
  }

  dragThis(pnt?: CropPoint) {
    this.dragging$.next(pnt?.id||'');
  }

  dragCropPoint(e: any) {
    const id = this.dragging$.value;
    if (!id) return;
    this._drag$.next({ id, x: e.clientX, y: e.clientY });
  }

  touchCropPoint(e: any) {
    const id = this.dragging$.value;
    if (!id) return;
    const touch = e.touches[0];
    if (!touch) return;
    this._drag$.next({ id, x: touch.clientX, y: touch.clientY });
  }
}

// const getScreenCoords = (e: HTMLElement): Pos => {
//   let rect = e.getBoundingClientRect();
//   return <Pos>{
//     x: window.screenX + rect.left,
//     y: window.screenY + rect.top
//   }
// }
