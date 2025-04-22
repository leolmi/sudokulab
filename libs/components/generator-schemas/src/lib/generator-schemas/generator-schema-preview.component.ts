import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardPreviewComponent } from '@olmi/board';
import { FlexModule } from '@angular/flex-layout';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ManagerComponentBase } from '@olmi/common';
import { combineLatest, map, Observable, of } from 'rxjs';
import { GenerationStat, GeneratorOptions, SudokuStat } from '@olmi/model';

@Component({
  selector: 'generator-schema-preview',
  imports: [
    CommonModule,
    BoardPreviewComponent,
    FlexModule,
    MatProgressSpinner
  ],
  template: `
    <!-- GENERATION PREVIEW -->
    @if (manager) {
      @if (manager.isRunning$|async) {
        <div class="generator-schema generator-stat-preview">
          <div class="generator-schema-content"
               fxLayout="column" fxLayoutAlign="start center">
            @if (manager.multiGenerationStat$|async; as stat) {
              <sudoku-board-preview [schema]="stat[index]?.currentSchema||''"></sudoku-board-preview>
              <div class="schema-details" fxFlex>{{generationDesc$|async}}</div>
              <mat-progress-spinner
                [mode]="(progressMode$|async)||'indeterminate'"
                [value]="(progress$|async)||0"
              ></mat-progress-spinner>
              <div class="schema-index" fxLayout="row" fxLayoutAlign="center center">
                <div>{{(index+1)}}</div>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
  styleUrl: './generator-schemas.component.scss',
  standalone: true
})
export class GeneratorSchemaPreviewComponent extends ManagerComponentBase implements OnInit {
  generationDesc$: Observable<string> = of('');
  progressMode$: Observable<'determinate'|'indeterminate'> = of('indeterminate');
  progress$: Observable<number> = of(0);

  @Input()
  index: number = 0;

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.manager) {
      const mgstat = this.manager.multiGenerationStat$.pipe(map(ms =>
        <GenerationStat>(<any>ms)[this.index]));

      this.generationDesc$ = mgstat.pipe(map((stat: GenerationStat|undefined) =>
          `running (${(stat?.generatedSchemaCount||0)}/${(stat?.managedSchemaCount||0)})...`));

      this.progress$ = combineLatest([mgstat, this.manager.generatorOptions$])
        .pipe(map(([stat, opt]: [GenerationStat | undefined, GeneratorOptions]) =>
          100-(((stat?.managedSchemaCount||0)/(opt.maxSchemaFillCycles||1))*100) ));

      this.progressMode$ = combineLatest([this.manager.stat$, this.manager.generatorOptions$])
        .pipe(map(([stat, opt]: [SudokuStat, GeneratorOptions]) =>
          (stat.fixedAndDynamicCount < opt.fixedCount) ? 'determinate' : 'indeterminate'));
    }
  }
}
