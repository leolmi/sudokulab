import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Component, ElementRef, HostListener, OnDestroy} from '@angular/core';
import {SudokuLab} from '@sudokulab/model';
import {map, takeUntil} from "rxjs/operators";

@Component({
  selector: 'destroy-component',
  template: '<div></div>'
})
export class DestroyComponent implements OnDestroy {
  protected readonly _resize$: BehaviorSubject<any>;
  protected _element$: BehaviorSubject<ElementRef|undefined>;
  protected readonly _destroy$: Subject<boolean>;
  compact$: Observable<boolean>;
  constructor(sudokuLab: SudokuLab) {
    this._destroy$ = new Subject<boolean>();
    this._resize$ = new BehaviorSubject<any>({});
    this._element$ = new BehaviorSubject<ElementRef | undefined>(undefined);
    this.compact$ = sudokuLab.state.compactLevel$.pipe(
      takeUntil(this._destroy$),
      map(l => l > 0));
  }

  @HostListener('window:resize')
  resize() {
    this._resize$.next({});
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
