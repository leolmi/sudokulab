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
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {CropInfo, CropPointPosition, PADDING, Shape, Vector} from "./image-handler.model";
import {
  calcAreaPoints,
  calcPointMovement, getAreaRect, getAreaSize,
  getCurrentPoint,
  getElementShape,
  getPointsStyle,
  getTouchMoovement,
  isEmptyShape
} from "./image-handler.helper";
import {map} from "rxjs/operators";


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
    <div class="crop-area-inner" #area>
      <svg width="100%" height="100%" viewBox="0 0 90 90" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <polygon [attr.points]="points$|async" class="crop-area-polygon" />
      </svg>
    </div>

  </div>`,
  styleUrls: ['./image-handler.component.scss']
})
export class CropAreaComponent implements AfterViewInit {
  private _winresize$: Subject<void>;
  private _refresh$: BehaviorSubject<any>;
  mooving$: BehaviorSubject<boolean>;
  cropPointStyle$: Observable<any>;
  currentPoint$: BehaviorSubject<CropPointPosition>;
  userMove$: BehaviorSubject<Vector>;
  cropShape$: BehaviorSubject<Shape>;
  points$: BehaviorSubject<string>;

  @ViewChild('area') area: ElementRef|undefined = undefined;

  @Input() set sync(s: any) {
    this._refresh$.next(s);
  }

  @Output() cropChanged: EventEmitter<CropInfo> = new EventEmitter<CropInfo>();

  constructor(protected _ele: ElementRef) {
    this._winresize$ = new Subject<void>();
    this._refresh$ = new BehaviorSubject<any>({});
    this.mooving$ = new BehaviorSubject<boolean>(false);
    this.currentPoint$ = new BehaviorSubject<CropPointPosition>('none');
    this.cropShape$ = new BehaviorSubject<Shape>(new Shape());
    this.userMove$ = new BehaviorSubject<Vector>({ x:0, y:0 });
    this.points$ = new BehaviorSubject<string>('');
    this.cropPointStyle$ = this.cropShape$.pipe(map(sh => getPointsStyle(sh)));

    this.cropShape$.subscribe(shape => {
      const area = getAreaSize(this._ele.nativeElement, PADDING);
      this.cropChanged.emit({ area, shape });
    });

    this._winresize$.subscribe(() => {
      let sh = this.cropShape$.value;
      if (isEmptyShape(sh)) {
        sh = getElementShape(_ele.nativeElement, PADDING);
        return this.cropShape$.next(sh);
      }
    })

    combineLatest([this.cropShape$, this._winresize$]).subscribe(([sh]) => {
      const points = calcAreaPoints(sh, _ele.nativeElement);
      this.points$.next(points);
    });
  }

  @HostListener('window:resize')
  resize() {
    this._winresize$.next();
  }

  leave() {
    this.currentPoint$.next('none');
    this.mooving$.next(false);
  }

  mousedown(e: any) {
    this.mooving$.next(this.currentPoint$.value !== 'none');
  }

  touchstart(e: any) {
    const movement = getTouchMoovement(e);
    const point = getCurrentPoint(this.cropShape$.value, movement);
    this.currentPoint$.next(point);
    this.mooving$.next(point !== 'none');
  }

  mousemoove(e: any) {
    const movement = <Vector>{ x: e.offsetX, y: e.offsetY};
    if (this.mooving$.value) {
      const point = this.currentPoint$.value;
      if (point === 'none') return;
      const position = this.cropShape$.value;
      const shape = calcPointMovement(position, movement, point);
      this.cropShape$.next(shape);
    } else {
      this.currentPoint$.next(getCurrentPoint(this.cropShape$.value, movement));
    }
  }

  touchmove(e: any) {
    const point = this.currentPoint$.value;
    if (point === 'none') return;
    e.stopPropagation();
    e.preventDefault();
    const movement = getTouchMoovement(e);
    const position = this.cropShape$.value;
    const shape = calcPointMovement(position, movement, point);
    this.cropShape$.next(shape);
  }

  ngAfterViewInit() {
    setTimeout(() => this._winresize$.next(), 250);
  }
}
