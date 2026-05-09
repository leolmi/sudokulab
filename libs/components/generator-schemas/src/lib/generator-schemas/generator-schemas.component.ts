import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MultiLogicManager, SUDOKU_STORE } from '@olmi/common';
import { BoardManager, BoardPreviewComponent } from '@olmi/board';
import { Sudoku } from '@olmi/model';
import { Router } from '@angular/router';
import { GeneratorSchemaPreviewComponent } from './generator-schema-preview.component';

@Component({
  selector: 'generator-schemas',
  imports: [
    BoardPreviewComponent,
    GeneratorSchemaPreviewComponent,
  ],
  templateUrl: './generator-schemas.component.html',
  styleUrl: './generator-schemas.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratorSchemasComponent {
  readonly store = inject(SUDOKU_STORE);
  private readonly _router = inject(Router);

  readonly manager = input<BoardManager | null | undefined>(null);
  readonly clickOnSchema = output<Sudoku>();

  readonly previews: any[] = Array(MultiLogicManager.count);

  previewClick(sdk: Sudoku) {
    this.clickOnSchema.emit(sdk);
  }

  openInPlayer(sdk: Sudoku) {
    this._router.navigate([`/player/${sdk._id}`]);
  }
}
