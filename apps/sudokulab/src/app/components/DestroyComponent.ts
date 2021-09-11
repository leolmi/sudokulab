import {Subject} from "rxjs";
import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";

@Component({
  selector: 'destroy-component',
  template: '<div></div>'
})
export class DestroyComponent implements OnDestroy {
  protected readonly _destroy$: Subject<boolean>;
  constructor() {
    this._destroy$ = new Subject<boolean>();
  }

  ngOnDestroy() {
    this._destroy$.next(true);
    this._destroy$.unsubscribe();
  }
}
