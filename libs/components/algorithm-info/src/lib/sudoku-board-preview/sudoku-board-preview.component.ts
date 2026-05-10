import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { BoardComponent, BoardManager, BoardStatus } from '@olmi/board';
import { decodeHighlightsString, Dictionary } from '@olmi/model';

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
  /**
   * Override degli `available` per cella: dizionario `coord` → stringa dei
   * candidati concatenati (es. `{ D9: '69', D3: '16' }`). Applicato dopo
   * `apply-rules`; serve quando lo snapshot di fase non è autoconsistente
   * e l'algoritmo vuole mostrare candidati specifici su alcune celle.
   */
  available?: Dictionary<string>;
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
  imports: [BoardComponent],
  providers: [BoardManager],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="board-preview" [style.width.px]="size()" [style.height.px]="size()">
      <sudoku-board></sudoku-board>
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
  private readonly _manager = inject(BoardManager);

  readonly sample = input<SudokuBoardPreviewSample | null>(null);

  /** Lato in px del quadrato della board (default 360). */
  readonly size = input<number>(360);

  constructor() {
    // status fisso: la preview è sempre read-only, no edit / pencil / paste.
    this._manager.options(<Partial<BoardStatus>>{
      isDisabled: false,
      isLock: false,
      isPencil: false,
      isAvailable: true,
      isCoord: true,
      isPasteEnabled: false,
    });

    // applica il sample in ordine deterministico (load → values → apply-rules
    // → available → highlights). Gli `available` sono forzati dopo
    // `apply-rules` così da sovrascrivere quanto calcolato dalle regole; gli
    // highlights sono in coda per non essere spazzati via da un successivo
    // apply-rules.
    effect(() => {
      const s = this.sample();
      if (!s?.schema) return;
      this._manager.load(s.schema);
      if (s.values) this._manager.values(s.values);
      this._manager.execOperation('apply-rules', { resetBefore: true });
      if (s.available) this._manager.forceAvailable(s.available);
      if (s.highlights) this._manager.setHighlights(decodeHighlightsString(s.highlights));
    });
  }
}
