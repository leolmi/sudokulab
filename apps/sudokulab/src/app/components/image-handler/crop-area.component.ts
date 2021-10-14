import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, skip } from 'rxjs/operators';
import { cloneDeep as _clone } from 'lodash';

const RADIUS = 12;
const PADDING = 50;

type CropPointPosition = 'TopLeft'|'TopRight'|'BottomLeft'|'BottomRight'|'none';

interface Vector {
  x: number;
  y: number;
}

interface Size {
  w: number,
  h: number
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RectPos {
  l: number;
  t: number;
  r: number;
  b: number;
}

@Component({
  selector: 'crop-area',
  template: `<div class="crop-area"
                  [ngClass]="{'mooving': mooving$|async, 'on-point': (currentPoint$|async)!=='none'}"
                  (mouseleave)="leave()"
                  (mousemove)="mousemoove($event)"
                  (mousedown)="mousedown($event)"
                  (mouseout)="leave()"
                  (mouseup)="leave()"
                  (touchstart)="touchstart($event)"
                  (touchend)="leave()"
                  (touchmove)="touchmove($event)"
                  (touchcancel)="leave()">
    <div class="crop-point"
         [ngClass]="{'active': (currentPoint$|async) === 'TopLeft'}"
         [ngStyle]="((cropPointStyle$|async)||{})['TopLeft']"></div>
    <div class="crop-point"
         [ngClass]="{'active': (currentPoint$|async) === 'TopRight'}"
         [ngStyle]="((cropPointStyle$|async)||{})['TopRight']"></div>
    <div class="crop-point"
         [ngClass]="{'active': (currentPoint$|async) === 'BottomLeft'}"
         [ngStyle]="((cropPointStyle$|async)||{})['BottomLeft']"></div>
    <div class="crop-point"
         [ngClass]="{'active': (currentPoint$|async) === 'BottomRight'}"
         [ngStyle]="((cropPointStyle$|async)||{})['BottomRight']"></div>
    <div class="crop-area-inner" [ngStyle]="cropAreaStyle$|async" #area>
      <svg width="100%" height="100%" viewBox="0 0 90 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

  </div>`,
  styleUrls: ['./image-handler.component.scss']
})
export class CropAreaComponent implements AfterViewInit {
  private _winresize$: BehaviorSubject<any>;
  private _refresh$: BehaviorSubject<any>;
  mooving$: BehaviorSubject<boolean>;
  cropAreaStyle$: Observable<any>;
  cropPointStyle$: Observable<any>;
  currentPoint$: BehaviorSubject<CropPointPosition>;
  cropRect$: BehaviorSubject<Rect>;
  userMove$: BehaviorSubject<RectPos>;

  @ViewChild('area') area: ElementRef|undefined = undefined;

  @Input() set sync(s: any) {
    this._refresh$.next(s);
  }

  @Output() cropChanged: EventEmitter<Rect> = new EventEmitter<Rect>();

  constructor(protected _ele: ElementRef) {
    this._winresize$ = new BehaviorSubject<any>({});
    this._refresh$ = new BehaviorSubject<any>({});
    this.mooving$ = new BehaviorSubject<boolean>(false);
    this.currentPoint$ = new BehaviorSubject<CropPointPosition>('none');
    this.cropRect$ = new BehaviorSubject<Rect>({ x:0, y:0, w:0, h:0 });
    this.userMove$ = new BehaviorSubject<RectPos>({ l:0, t:0, r:0, b:0 });

    this.cropPointStyle$ = this.cropRect$.pipe(map(p => getPointsStyle(p)));
    this.cropAreaStyle$ = this.cropRect$.pipe(map(p => getAreaStyle(p)));

    this._refresh$.pipe(skip(1)).subscribe(() => this.userMove$.next({ l:0, t:0, r:0, b:0 }))

    combineLatest(this._winresize$, this.userMove$).subscribe(([r, um]) => {
      const position = calcPointPositions(um, _ele.nativeElement.parentElement);
      this.cropRect$.next(position);
    });

    this.cropRect$
      .pipe(skip(1), filter(cr => !!cr))
      .subscribe(cr => this.cropChanged.emit(getCropRect(cr, _ele.nativeElement.parentElement)));
  }

  @HostListener('window:resize')
  resize() {
    this._winresize$.next({});
  }

  leave() {
    this.currentPoint$.next('none');
    this.mooving$.next(false);
  }

  mousedown(e: any) {
    console.log('MOUSE DOWN ORIGINAL', e);
    this.mooving$.next(this.currentPoint$.getValue() !== 'none');
  }

  touchstart(e: any) {
    console.log('TOUCH DOWN ORIGINAL', e);
    const movement = getTouchMoovement(e);
    const point = getCurrentPoint(this.cropRect$.getValue(), movement);
    this.currentPoint$.next(point);
    this.mooving$.next(point !== 'none');
  }

  mousemoove(e: any) {
    const movement = <Vector>{ x: e.offsetX, y: e.offsetY};
    if (this.mooving$.getValue()) {
      const point = this.currentPoint$.getValue();
      if (point === 'none') return;
      const position = this.userMove$.getValue();
      const move = calcMovement(position, movement, point, this._ele.nativeElement.parentElement);
      this.userMove$.next(move);
    } else {
      this.currentPoint$.next(getCurrentPoint(
        this.cropRect$.getValue(), movement));
    }
  }

  touchmove(e: any) {
    const point = this.currentPoint$.getValue();
    if (point === 'none') return;
    e.stopPropagation();
    e.preventDefault();
    const movement = getTouchMoovement(e);
    const position = this.userMove$.getValue();
    const move = calcMovement(position, movement, point, this._ele.nativeElement.parentElement);
    this.userMove$.next(move);
  }

  ngAfterViewInit() {
    setTimeout(() => this._winresize$.next({}), 250);
  }
}

const getTouchMoovement = (e: any): Vector => {
  const rect = e.target.getBoundingClientRect();
  const evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
  const touch = evt.touches[0] || evt.changedTouches[0];
  return <Vector>{ x: touch.pageX - rect.left, y: touch.pageY - rect.top};
}

const getSize = (ele: HTMLElement): Size => {
  return {
    w: ele.clientWidth - (2*PADDING),
    h: ele.clientHeight - (2*PADDING)
  }
}

const calcPointPositions = (move: RectPos, ele: HTMLElement): Rect => {
  const size = getSize(ele);
  return {
    x: ele.clientLeft + PADDING + (size.w * move.l),
    y: ele.clientTop + PADDING + (size.h * move.t),
    w: size.w * (1 - move.l - move.r),
    h: size.h * (1 - move.t - move.b)
  }
}

const getPointsStyle = (p: Rect): any => {
  const x1 = p.x||0
  const y1 = p.y||0;
  const x2 = (p.w||0) + (p.x||0);
  const y2 = (p.h||0) + (p.y||0);
  return {
    TopLeft: { left:`${x1-RADIUS}px`, top: `${y1-RADIUS}px` },
    TopRight: { left:`${x2-RADIUS}px`, top: `${y1-RADIUS}px` },
    BottomLeft: { left:`${x1-RADIUS}px`, top: `${y2-RADIUS}px` },
    BottomRight: { left:`${x2-RADIUS}px`, top: `${y2-RADIUS}px` }
  }
}

const getAreaStyle = (p: Rect): any => {
  return {
    left: `${p.x || 0}px`,
    top: `${p.y || 0}px`,
    width: `${p.w || 0}px`,
    height: `${p.h || 0}px`
  }
}

const getCurrentPoint = (crop: Rect, e: any): CropPointPosition => {
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

const calcMovement = (position: RectPos,
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

const getCropRect = (cr: Rect, ele: HTMLElement): Rect => {
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
