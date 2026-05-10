import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { BoardManager, BoardPreviewComponent } from '@olmi/board';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { SudokuState } from '@olmi/common';
import { GenerationStat } from '@olmi/model';

@Component({
  selector: 'generator-schema-preview',
  standalone: true,
  imports: [
    BoardPreviewComponent,
    MatProgressSpinner,
  ],
  template: `
    <!-- GENERATION PREVIEW -->
    @if (globalState.isRunning()) {
      <div class="generator-schema generator-stat-preview">
        <div class="generator-schema-content flex-col flex-align-start-center">
          @let stat = slotStat();
          @if (stat) {
            <sudoku-board-preview [schema]="stat.currentSchema || ''"></sudoku-board-preview>
            <div class="schema-details flex-1">{{ generationDesc() }}</div>
            <mat-progress-spinner
              [mode]="progressMode()"
              [value]="progress()"
            ></mat-progress-spinner>
            <div class="schema-index flex-row flex-align-center-center">
              <div>{{ index() + 1 }}</div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './generator-schemas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratorSchemaPreviewComponent {
  readonly globalState = SudokuState;
  private readonly _manager = inject(BoardManager);

  readonly index = input<number>(0);

  // GenerationStat dello slot corrente, derivata dal multiGenerationStat del manager
  protected readonly slotStat = computed<GenerationStat | undefined>(
    () => this._manager.multiGenerationStat()[this.index()],
  );

  protected readonly generationDesc = computed<string>(() => {
    const stat = this.slotStat();
    return `running (${stat?.generatedSchemaCount || 0}/${stat?.managedSchemaCount || 0})...`;
  });

  protected readonly progress = computed<number>(() => {
    const stat = this.slotStat();
    const opt = this._manager.generatorOptions();
    return 100 - (((stat?.managedSchemaCount || 0) / (opt.maxSchemaFillCycles || 1)) * 100);
  });

  protected readonly progressMode = computed<'determinate' | 'indeterminate'>(() => {
    const stat = this._manager.stat();
    const opt = this._manager.generatorOptions();
    return (stat.fixedAndDynamicCount < opt.fixedCount) ? 'determinate' : 'indeterminate';
  });
}
