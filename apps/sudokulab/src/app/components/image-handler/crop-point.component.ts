import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {getTouchMoovement} from "./image-handler.helper";
import {Vector} from "./image-handler.model";


@Component({
  selector: 'crop-point',
  template: `
    <div class="crop-point"
         (mouseleave)="leave()"
         (mousemove)="mousemoove($event)"
         (mousedown)="mousedown($event)"
         (mouseout)="leave()"
         (mouseup)="leave()"
         (touchstart)="touchstart($event)"
         (touchend)="leave()"
         (touchmove)="touchmove($event)"
         (touchcancel)="leave()"
    ></div>`,
  styleUrls: ['./image-handler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropPointComponent implements AfterViewInit {
  // private _winresize$: BehaviorSubject<any>;
  // private _refresh$: BehaviorSubject<any>;
  mooving$: BehaviorSubject<boolean>;

  @Output()
  onMooving: EventEmitter<any> = new EventEmitter<any>();

  constructor(protected _ele: ElementRef) {
    // this._winresize$ = new BehaviorSubject<any>({});
    // this._refresh$ = new BehaviorSubject<any>({});
    this.mooving$ = new BehaviorSubject<boolean>(false);
  }

  ngAfterViewInit() {
    // setTimeout(() => this._winresize$.next({}), 250);
  }

  // @HostListener('window:resize')
  // resize() {
  //   this._winresize$.next({});
  // }

  leave() {
    // this.currentPoint$.next('none');
    this.mooving$.next(false);
  }

  mousedown(e: any) {
    // console.log('MOUSE DOWN ORIGINAL', e);
    this.mooving$.next(true);
  }

  touchstart(e: any) {
    // console.log('TOUCH DOWN ORIGINAL', e);
    this.mooving$.next(true);
  }

  mousemoove(e: any) {
    const movement = <Vector>{ x: e.offsetX, y: e.offsetY};
    if (this.mooving$.getValue()) {
      // const point = this.currentPoint$.getValue();
      // if (point === 'none') return;
      // const position = this.userMove$.getValue();
      // const move = calcMovement(position, movement, point, this._ele.nativeElement.parentElement);
      // this.userMove$.next(move);
    } else {
      // this.currentPoint$.next(getCurrentPoint(
      //   this.cropRect$.getValue(), movement));
    }
  }

  touchmove(e: any) {
    // const point = this.currentPoint$.getValue();
    // if (point === 'none') return;
    e.stopPropagation();
    e.preventDefault();
    const movement = getTouchMoovement(e);
    // const position = this.userMove$.getValue();
    // const move = calcMovement(position, movement, point, this._ele.nativeElement.parentElement);
    // this.userMove$.next(move);
  }
}
