import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

@Component({
  selector: 'destroy-base-component',
  template: '',
  imports: [CommonModule],
  standalone: true
})
export class DestroyComponentBase implements OnDestroy {
  protected readonly _destroy$: Subject<void>;
  constructor() {
    this._destroy$ = new Subject<void>();
  }
  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.unsubscribe();
  }
}
