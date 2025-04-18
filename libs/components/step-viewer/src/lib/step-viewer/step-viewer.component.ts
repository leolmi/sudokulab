import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BehaviorSubject } from 'rxjs';
import { StepViewerItem } from './step-viewer.model';
import { AlgorithmResult } from '@olmi/model';
import { getItems } from './step-viewer.logic';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'step-viewer',
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatIcon
  ],
  templateUrl: './step-viewer.component.html',
  styleUrl: './step-viewer.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepViewerComponent {
  items$: BehaviorSubject<StepViewerItem[]>;
  selected$: BehaviorSubject<string>;
  clicked$: BehaviorSubject<any>;
  autoHeight$: BehaviorSubject<boolean>;
  appliedIndex$: BehaviorSubject<number>;

  @Input()
  set sequence(s: AlgorithmResult[]|null|undefined) {
    const items = getItems(s||[]);
    this.items$.next(items);
    this.clicked$.next({});
    this.selected$.next('');
    this.appliedIndex$.next(items.length-1);
  }

  @Input()
  set autoHeight(ah: boolean) {
    this.autoHeight$.next(ah);
  }

  @Output()
  onClickItem: EventEmitter<StepViewerItem> = new EventEmitter<StepViewerItem>();
  @Output()
  onApplyItem: EventEmitter<AlgorithmResult> = new EventEmitter<AlgorithmResult>();

  constructor() {
    this.items$ = new BehaviorSubject<StepViewerItem[]>([]);
    this.selected$ = new BehaviorSubject<string>('');
    this.clicked$ = new BehaviorSubject<any>({});
    this.autoHeight$ = new BehaviorSubject(false);
    this.appliedIndex$ = new BehaviorSubject<number>(-1);
  }

  clickOnItem(item: StepViewerItem) {
    if (item.groupTitle) return;
    this.clicked$.next({...this.clicked$.value, [item.id]: true});
    this.selected$.next(item?.id||'');
    this.onClickItem.emit(item);
  }

  applyStep(index: number) {
    this.appliedIndex$.next(index);
    const item = this.items$.value[index];
    if (item?.result) this.onApplyItem.emit(item.result);
  }
}
