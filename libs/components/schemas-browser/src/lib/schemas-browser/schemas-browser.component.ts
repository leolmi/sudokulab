import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { checkNumber, Sudoku } from '@olmi/model';
import { BehaviorSubject, combineLatest, map, Observable, take } from 'rxjs';
import { findIndex } from 'lodash';
import { BoardPreviewComponent } from '@olmi/board';
import { FlexModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DestroyComponentBase, SUDOKU_STATE } from '@olmi/common';
import { ItemTooltipPipe, UserPlayingPipe } from './pipes';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'schemas-browser',
  imports: [
    CommonModule,
    FlexModule,
    BoardPreviewComponent,
    MatIconModule,
    MatTooltipModule,
    ItemTooltipPipe,
    UserPlayingPipe,
    ScrollingModule,
  ],
  templateUrl: './schemas-browser.component.html',
  styleUrl: './schemas-browser.component.scss',
  standalone: true
})
export class SchemasBrowserComponent extends DestroyComponentBase {
  private readonly _skipScrollTo$: BehaviorSubject<boolean>;

  readonly state = inject(SUDOKU_STATE)
  schemas$: BehaviorSubject<Sudoku[]>;
  activeSchema$: BehaviorSubject<string>;
  hideTooltip$: Observable<boolean>;
  diameter$: Observable<number>;

  @ViewChild('container') container!: CdkVirtualScrollViewport;

  @Input()
  set activeSchema(s: string|null|undefined) {
    if (this.activeSchema$.value !== s) {
      this.activeSchema$.next(s||'');
    }
  }

  @Input()
  set schemas(s: Sudoku[]|null|undefined) {
    this.schemas$.next(s||[]);
  }

  @Input()
  allowCompact = false;

  @Output()
  clickOnSchema: EventEmitter<Sudoku> = new EventEmitter<Sudoku>();

  constructor() {
    super();
    this._skipScrollTo$ = new BehaviorSubject<boolean>(false);
    this.activeSchema$ = new BehaviorSubject<string>('');
    this.schemas$ = new BehaviorSubject<Sudoku[]>([]);

    this.hideTooltip$ = this.state.layout$.pipe(map(l => !this.allowCompact || !l.compact));
    this.diameter$ = this.state.layout$.pipe(map(l => (l.compact && this.allowCompact) ? 30 : 100));
    this.activeSchema$.subscribe(() => setTimeout(() => this._scrollToActive(), 150));
  }

  private _scrollToActive() {
    combineLatest([this.schemas$, this.activeSchema$, this._skipScrollTo$])
      .pipe(take(1))
      .subscribe(([schemas, active, skip]: [Sudoku[], string, boolean]) => {
        if (!skip) {
          const activeIndex = findIndex(schemas, s => s.values === active);
          if (activeIndex > -1 && this.container) this.container.scrollToIndex(checkNumber(activeIndex-4, 0, activeIndex) , 'smooth');
        } else {
          this._skipScrollTo$.next(false);
        }
      });
  }

  internalClickOnSchema(sdk: Sudoku) {
    this._skipScrollTo$.next(true)
    this.clickOnSchema.emit(sdk);
  }
}


