import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerComponentBase, SUDOKU_STORE } from '@olmi/common';
import { BoardPreviewComponent } from '@olmi/board';
import { FlexModule } from '@angular/flex-layout';
import { combineLatest, map, Observable, of } from 'rxjs';
import { GenerationStat, GeneratorOptions, Sudoku, SudokuStat } from '@olmi/model';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'generator-schemas',
  imports: [
    CommonModule,
    BoardPreviewComponent,
    FlexModule,
    MatProgressSpinner
  ],
  templateUrl: './generator-schemas.component.html',
  styleUrl: './generator-schemas.component.scss',
  standalone: true
})
export class GeneratorSchemasComponent extends ManagerComponentBase implements OnInit {
  store = inject(SUDOKU_STORE);
  private readonly _router = inject(Router);
  generationDesc$: Observable<string> = of('');
  progressMode$: Observable<'determinate'|'indeterminate'> = of('indeterminate');
  progress$: Observable<number> = of(0);

  @Output()
  clickOnSchema: EventEmitter<Sudoku> = new EventEmitter<Sudoku>();

  ngOnInit() {
    if (this.manager) {
      this.generationDesc$ = this.manager.generationStat$.pipe(
        map(stat =>
          `running (${(stat?.generatedSchemaCount||0)}/${(stat?.managedSchemaCount||0)})...`));

      this.progress$ = combineLatest([this.manager.generationStat$, this.manager.generatorOptions$])
        .pipe(map(([gstat, opt]: [GenerationStat | undefined, GeneratorOptions]) =>
          100-(((gstat?.managedSchemaCount||0)/(opt.maxSchemaFillCycles||1))*100) ));

      this.progressMode$ = combineLatest([this.manager.stat$, this.manager.generatorOptions$])
        .pipe(map(([stat, opt]: [SudokuStat, GeneratorOptions]) =>
          (stat.fixedAndDynamicCount < opt.fixedCount) ? 'determinate' : 'indeterminate'));
    }
  }

  previewClick(sdk: Sudoku) {
    this.clickOnSchema.emit(sdk);
  }

  openInPlayer(sdk: Sudoku) {
    this._router.navigate([`/player/${sdk._id}`]);
  }
}
