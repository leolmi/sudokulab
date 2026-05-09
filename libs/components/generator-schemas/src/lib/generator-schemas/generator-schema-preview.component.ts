import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BoardManager, BoardPreviewComponent } from '@olmi/board';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { SudokuState } from '@olmi/common';
import { GenerationStat } from '@olmi/model';

@Component({
  selector: 'generator-schema-preview',
  imports: [
    BoardPreviewComponent,
    MatProgressSpinner,
  ],
  template: `
    <!-- GENERATION PREVIEW -->
    @if (globalState.isRunning()) {
      @let m = manager();
      <div class="generator-schema generator-stat-preview">
        <div class="generator-schema-content flex-col flex-align-start-center">
          @if (m) {
            @let stat = m.multiGenerationStat();
            @if (stat) {
              <sudoku-board-preview [schema]="stat[index()]?.currentSchema||''"></sudoku-board-preview>
              <div class="schema-details flex-1">{{generationDesc()}}</div>
              <mat-progress-spinner
                [mode]="progressMode()"
                [value]="progress()"
              ></mat-progress-spinner>
              <div class="schema-index flex-row flex-align-center-center">
                <div>{{(index()+1)}}</div>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styleUrl: './generator-schemas.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratorSchemaPreviewComponent {
  readonly globalState = SudokuState;

  readonly manager = input<BoardManager | null | undefined>(null);
  readonly index = input<number>(0);

  // GenerationStat dello slot corrente, derivata dal multiGenerationStat del manager
  private readonly _slotStat = computed<GenerationStat | undefined>(() => {
    const m = this.manager();
    if (!m) return undefined;
    return <GenerationStat>(<any>m.multiGenerationStat())[this.index()];
  });

  readonly generationDesc = computed<string>(() => {
    const stat = this._slotStat();
    return `running (${(stat?.generatedSchemaCount || 0)}/${(stat?.managedSchemaCount || 0)})...`;
  });

  readonly progress = computed<number>(() => {
    const m = this.manager();
    if (!m) return 0;
    const stat = this._slotStat();
    const opt = m.generatorOptions();
    return 100 - (((stat?.managedSchemaCount || 0) / (opt.maxSchemaFillCycles || 1)) * 100);
  });

  readonly progressMode = computed<'determinate' | 'indeterminate'>(() => {
    const m = this.manager();
    if (!m) return 'indeterminate';
    const stat = m.stat();
    const opt = m.generatorOptions();
    return (stat.fixedAndDynamicCount < opt.fixedCount) ? 'determinate' : 'indeterminate';
  });
}
