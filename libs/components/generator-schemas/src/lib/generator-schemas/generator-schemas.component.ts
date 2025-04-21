import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerComponentBase, MultiLogicManager, SUDOKU_STORE } from '@olmi/common';
import { BoardPreviewComponent } from '@olmi/board';
import { FlexModule } from '@angular/flex-layout';
import { Sudoku } from '@olmi/model';
import { Router } from '@angular/router';
import { GeneratorSchemaPreviewComponent } from './generator-schema-preview.component';

@Component({
  selector: 'generator-schemas',
  imports: [
    CommonModule,
    BoardPreviewComponent,
    FlexModule,
    GeneratorSchemaPreviewComponent
  ],
  templateUrl: './generator-schemas.component.html',
  styleUrl: './generator-schemas.component.scss',
  standalone: true
})
export class GeneratorSchemasComponent extends ManagerComponentBase {
  store = inject(SUDOKU_STORE);
  private readonly _router = inject(Router);
  previews: any[];

  @Output()
  clickOnSchema: EventEmitter<Sudoku> = new EventEmitter<Sudoku>();

  constructor() {
    super();
    this.previews = Array(MultiLogicManager.count);
  }

  previewClick(sdk: Sudoku) {
    this.clickOnSchema.emit(sdk);
  }

  openInPlayer(sdk: Sudoku) {
    this._router.navigate([`/player/${sdk._id}`]);
  }
}
