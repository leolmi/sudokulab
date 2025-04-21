import { TemplateComponent } from '../../template.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getPageArea } from '@olmi/model';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BoardPreviewComponent } from '@olmi/board';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'print-page-template-couple-a4v',
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    BoardPreviewComponent
  ],
  template: `
    <div class="print-template-container" fxLayout="column">
      <div class="print-page-area top"
           [class.active]="(printDocument.activeArea$|async)===pageId+'.0'"
           (click)="setActive(0)"
           fxFlex>
        <sudoku-board-preview [schema]="schemaTop$|async"></sudoku-board-preview>
      </div>
      <div class="print-page-area top-line bottom"
           [class.active]="(printDocument.activeArea$|async)===pageId+'.1'"
           (click)="setActive(1)"
           fxFlex>
        <sudoku-board-preview [schema]="schemaBottom$|async"></sudoku-board-preview>
      </div>
    </div>
  `,
  styleUrls: ['../../template.component.scss', './coupleA4V.component.scss']
})
export class CoupleA4VComponent extends TemplateComponent {
  schemaTop$: Observable<string>;
  schemaBottom$: Observable<string>;

  constructor() {
    super();
    this.schemaTop$ = this.getSchema$(0);
    this.schemaBottom$ = this.getSchema$(1);
  }

  setActive(index: number) {
    this.printDocument.activeArea$.next(getPageArea(this.pageId, index));
  }
}
