import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  Input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent, BoardManager, BoardStatus } from '@olmi/board';
import {
  ApplySudokuRulesOptions,
  buildSudokuCells,
  decodeHighlightsString,
  Highlights,
  SudokuCell,
} from '@olmi/model';

/**
 * Board read-only usata come "tool" dalle pagine di descrizione degli algoritmi.
 *
 * Riceve in ingresso la stringa dei valori e (opzionalmente) highlights già
 * costruiti. Disabilita l'interazione (no click, no selezione, no tastiera).
 * Non impone il layout: chi la usa può metterla in grid, card, flex, ecc.
 */
@Component({
  selector: 'sudoku-board-preview',
  standalone: true,
  imports: [CommonModule, BoardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="board-preview" [style.width.px]="size" [style.height.px]="size">
      <sudoku-board (onReady)="onBoard($event)"></sudoku-board>
    </div>
  `,
  styles: [
    `
      .board-preview {
        display: inline-block;
        max-width: 100%;
        pointer-events: none;
        user-select: none;
      }
      .board-preview ::ng-deep sudoku-board {
        pointer-events: none;
      }
    `,
  ],
})
export class SudokuBoardPreviewComponent {
  private readonly _manager = signal<BoardManager | null>(null);
  private readonly _values = signal<string>('');
  private readonly _highlights = signal<string | null>(null);

  @Input() set values(v: string | null | undefined) {
    this._values.set(v || '');
  }

  @Input() set highlights(hl: string | null) {
    this._highlights.set(hl);
  }

  /** Lato in px del quadrato della board (default 360). */
  @Input() size = 360;

  readonly previewStatus: Partial<BoardStatus> = {
    isDisabled: false,
    isLock: false,
    isPencil: false,
    isAvailable: true,
    isCoord: true,
    isPasteEnabled: false,
  };

  onBoard(manager: BoardManager) {
    this._manager.set(manager);
  }

  constructor() {
    effect(() => {
      const manager = this._manager();
      const values = this._values();
      if (manager && values) {
        manager.load(values);
        manager.execOperation('apply-rules', { resetBefore: true });
      }
    });

    effect(() => {
      const manager = this._manager();
      const highlights = this._highlights();
      if (manager && highlights) manager.setHighlights(decodeHighlightsString(highlights));
    });

    effect(() => {
      const manager = this._manager();
      if (manager) manager.options(this.previewStatus);
    });
  }
}
