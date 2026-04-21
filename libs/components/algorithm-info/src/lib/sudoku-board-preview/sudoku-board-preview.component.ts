import { ChangeDetectionStrategy, Component, effect, Input, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardComponent, BoardManager, BoardStatus } from '@olmi/board';
import { decodeHighlightsString } from '@olmi/model';

/**
 * Descrizione di un esempio mostrabile dalla board-preview.
 *
 * Incapsula le tre informazioni che definiscono lo stato della griglia:
 * il clue iniziale (`schema`), lo stato corrente con i dinamici (`values`)
 * e le evidenziazioni (`highlights`). Solo `schema` è obbligatorio; se
 * presenti, `values` e `highlights` vengono applicati in ordine dopo lo
 * schema.
 */
export interface SudokuBoardPreviewSample {
  /** Clue iniziale del puzzle (81 char). Definisce le celle fisse. */
  schema: string;
  /** Stato corrente (81 char, fissi + dinamici). Assente = mostra solo lo schema. */
  values?: string;
  /** Stringa highlights nel formato accettato da `decodeHighlightsString`. */
  highlights?: string;
}

/**
 * Board read-only usata come "tool" dalle pagine di descrizione degli algoritmi.
 *
 * Riceve in ingresso un `SudokuBoardPreviewSample` che raccoglie schema, values
 * e highlights dell'esempio da visualizzare. Disabilita l'interazione (no click,
 * no selezione, no tastiera). Non impone il layout: chi la usa può metterla in
 * grid, card, flex, ecc.
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
  readonly sample = input<SudokuBoardPreviewSample | null>(null);

  /** Lato in px del quadrato della board (default 360). */
  @Input() size = 360;

  private readonly _manager = signal<BoardManager | null>(null);

  // Costanti: la preview è sempre read-only, no edit / pencil / paste.
  private readonly previewStatus: Partial<BoardStatus> = {
    isDisabled: false,
    isLock: false,
    isPencil: false,
    isAvailable: true,
    isCoord: true,
    isPasteEnabled: false,
  };

  onBoard(manager: BoardManager) {
    // `previewStatus` è costante: impostato una sola volta all'arrivo del
    // manager, non serve un effect dedicato.
    manager.options(this.previewStatus);
    this._manager.set(manager);
  }

  constructor() {
    // Unico effect: quando il manager è pronto e arriva un sample, lo applica
    // in ordine deterministico (load → values → apply-rules → highlights).
    // Gli highlights sono l'ultima operazione così non vengono sovrascritti da
    // un successivo apply-rules.
    effect(() => {
      const manager = this._manager();
      const s = this.sample();
      if (!manager || !s?.schema) return;
      manager.load(s.schema);
      if (s.values) manager.values(s.values);
      manager.execOperation('apply-rules', { resetBefore: true });
      if (s.highlights) manager.setHighlights(decodeHighlightsString(s.highlights));
    });
  }
}
