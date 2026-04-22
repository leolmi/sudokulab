import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DestroyComponentBase } from './destroy.component.base';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'manager-base-component',
  template: '',
  imports: [CommonModule],
  standalone: true
})
export class ManagerComponentBase<TManager = unknown> extends DestroyComponentBase {
  manager$: BehaviorSubject<TManager|undefined>;

  @Input()
  set manager(m: TManager|undefined|null) {
    this.manager$.next(m||undefined);
  }
  get manager(): TManager|undefined {
    return this.manager$.value;
  }

  constructor() {
    super();

    this.manager$ = new BehaviorSubject<TManager | undefined>(undefined);
  }
}
