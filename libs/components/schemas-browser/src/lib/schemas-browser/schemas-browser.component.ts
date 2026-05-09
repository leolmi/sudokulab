import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { checkNumber, Sudoku } from '@olmi/model';
import { findIndex } from 'lodash';
import { BoardPreviewComponent } from '@olmi/board';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SUDOKU_STATE } from '@olmi/common';
import { ItemTooltipPipe, UserPlayingPipe } from './pipes';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'schemas-browser',
  imports: [
    BoardPreviewComponent,
    MatIconModule,
    MatTooltipModule,
    ItemTooltipPipe,
    UserPlayingPipe,
    ScrollingModule,
  ],
  templateUrl: './schemas-browser.component.html',
  styleUrl: './schemas-browser.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemasBrowserComponent {
  private readonly _state = inject(SUDOKU_STATE);
  private readonly _skipScrollTo = signal<boolean>(false);

  readonly schemas = input<Sudoku[] | null | undefined>([]);
  readonly activeSchema = input<string | null | undefined>('');
  readonly allowCompact = input<boolean>(false);

  readonly clickOnSchema = output<Sudoku>();

  readonly container = viewChild<CdkVirtualScrollViewport>('container');

  readonly hideTooltip = computed<boolean>(() => !this.allowCompact() || !this._state.layout().compact);
  readonly diameter = computed<number>(() =>
    (this._state.layout().compact && this.allowCompact()) ? 30 : 100);

  constructor() {
    // scroll allo schema attivo quando cambia (dopo un piccolo delay per
    // permettere al virtual scroll di completare il render)
    effect(() => {
      const active = this.activeSchema();
      const schemas = this.schemas();
      const skip = this._skipScrollTo();
      // dipendenza tracciata: la chiamata di queste signal serve da trigger
      void active; void schemas;
      setTimeout(() => this._scrollToActive(), 150);
    });
  }

  private _scrollToActive() {
    const skip = this._skipScrollTo();
    if (skip) {
      this._skipScrollTo.set(false);
      return;
    }
    const schemas = this.schemas() || [];
    const active = this.activeSchema() || '';
    const activeIndex = findIndex(schemas, s => s.values === active);
    const container = this.container();
    if (activeIndex > -1 && container) {
      container.scrollToIndex(checkNumber(activeIndex - 4, 0, activeIndex), 'smooth');
    }
  }

  internalClickOnSchema(sdk: Sudoku) {
    this._skipScrollTo.set(true);
    this.clickOnSchema.emit(sdk);
  }
}
