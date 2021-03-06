import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Component, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { SudokuFacade } from '@sudokulab/model';

@Component({
  selector: 'destroy-component',
  template: '<div></div>'
})
export class DestroyComponent implements OnDestroy {
  protected readonly _resize$: BehaviorSubject<any>;
  protected _element$: BehaviorSubject<ElementRef|undefined>;
  protected readonly _destroy$: Subject<boolean>;
  compact$: Observable<boolean>;
  constructor(protected _sudoku: SudokuFacade) {
    this._destroy$ = new Subject<boolean>();
    this._resize$ = new BehaviorSubject<any>({});
    this._element$ = new BehaviorSubject<ElementRef | undefined>(undefined);
    this.compact$ = _sudoku.selectIsCompact$;
  }

  checkCompact() { this._sudoku.checkCompactStatus(); }

  @HostListener('window:resize')
  resize() {
    this._resize$.next({});
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
