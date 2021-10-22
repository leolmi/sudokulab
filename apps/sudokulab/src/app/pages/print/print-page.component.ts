import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { PrintPage, Sudoku } from '@sudokulab/model';
import { map } from 'rxjs/operators';




@Component({
  selector: 'print-page',
  templateUrl: './print-page.component.html',
  styleUrls: ['./print.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintPageComponent {
  private _mode$: BehaviorSubject<string>;
  page$: BehaviorSubject<PrintPage|undefined>;
  activeId$: BehaviorSubject<string|null>;
  alone$: BehaviorSubject<boolean>;
  isAddMode$: Observable<boolean>;

  @Input() set page(p: PrintPage|undefined) {
    this.page$.next(p);
  }
  @Input() set activeId(i: string|null) {
    this.activeId$.next(i);
  }
  @Input() set mode(m: string) {
    this._mode$.next(m);
  };
  @Input() set alone(a: boolean) {
    this.alone$.next(a);
  }

  @Output() activeChanged: EventEmitter<string> = new EventEmitter<string>();
  @Output() addPage: EventEmitter<any> = new EventEmitter<any>();
  @Output() removePage: EventEmitter<string> = new EventEmitter<string>();
  @Output() clearPage: EventEmitter<string> = new EventEmitter<string>();

  constructor() {
    this._mode$ = new BehaviorSubject<string>('page');
    this.page$ = new BehaviorSubject<PrintPage|undefined>(undefined);
    this.activeId$ = new BehaviorSubject<string|null>(null);
    this.alone$ = new BehaviorSubject<boolean>(false);
    this.isAddMode$ = this._mode$.pipe(map(m => m === 'add'));
  }

  setActive(target: string) {
    this.activeChanged.emit(`${this.page$.getValue()?.id||''}_${target}`)
  }
  add() {
    this.addPage.emit({});
  }
  clear() {
    this.clearPage.next(this.page$.getValue()?.id);
  }
  remove() {
    this.removePage.next(this.page$.getValue()?.id);
  }
}
