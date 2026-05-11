import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MultiLogicManager, SUDOKU_STORE, TranslateService } from '@olmi/common';
import { BoardPreviewComponent } from '@olmi/board';
import { Sudoku } from '@olmi/model';
import { Router } from '@angular/router';
import { GeneratorSchemaPreviewComponent } from './generator-schema-preview.component';

@Component({
  selector: 'generator-schemas',
  standalone: true,
  imports: [
    BoardPreviewComponent,
    GeneratorSchemaPreviewComponent,
  ],
  templateUrl: './generator-schemas.component.html',
  styleUrl: './generator-schemas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratorSchemasComponent {
  readonly store = inject(SUDOKU_STORE);
  readonly tr = inject(TranslateService);
  private readonly _router = inject(Router);

  readonly clickOnSchema = output<Sudoku>();

  readonly previews: number[] = Array.from({ length: MultiLogicManager.count }, (_, i) => i);

  previewClick(sdk: Sudoku) {
    this.clickOnSchema.emit(sdk);
  }

  openInPlayer(sdk: Sudoku) {
    this._router.navigate([`/player/${sdk._id}`]);
  }
}
