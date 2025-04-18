import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DestroyComponentBase } from './destroy.component.base';
import { BehaviorSubject } from 'rxjs';
import { BoardManager } from '@olmi/board';

@Component({
  selector: 'manager-base-component',
  template: '',
  imports: [CommonModule],
  standalone: true
})
export class ManagerComponentBase extends DestroyComponentBase {
  manager$: BehaviorSubject<BoardManager|undefined>;

  @Input()
  set manager(m: BoardManager|undefined|null) {
    this.manager$.next(m||undefined);
  }
  get manager(): BoardManager|undefined {
    return this.manager$.value;
  }

  constructor() {
    super();

    this.manager$ = new BehaviorSubject<BoardManager | undefined>(undefined);
  }
}
