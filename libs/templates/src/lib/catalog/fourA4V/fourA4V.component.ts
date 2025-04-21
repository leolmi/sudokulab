import { TemplateComponent } from '../../template.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getPageArea } from '@olmi/model';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BoardPreviewComponent } from '@olmi/board';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'print-page-template-four-a4v',
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    BoardPreviewComponent
  ],
  template: `
    <div class="print-template-container" fxLayout="column">
      <div fxLayout="row" fxLayoutAlign="start stretch" fxFlex>
        <div class="print-page-area top"
             [class.active]="(printDocument.activeArea$|async)===(pageId+'.0')"
             (click)="setActive(0)"
             fxFlex>
          <sudoku-board-preview [schema]="schemaTopLeft$|async"></sudoku-board-preview>
        </div>
        <div class="print-page-area left-line bottom"
             [class.active]="(printDocument.activeArea$|async)===(pageId+'.1')"
             (click)="setActive(1)"
             fxFlex>
          <sudoku-board-preview [schema]="schemaTopRight$|async"></sudoku-board-preview>
        </div>
      </div>
      <div class="top-line" fxLayout="row" fxLayoutAlign="start stretch" fxFlex>
        <div class="print-page-area top"
             [class.active]="(printDocument.activeArea$|async)===(pageId+'.2')"
             (click)="setActive(2)"
             fxFlex>
          <sudoku-board-preview [schema]="schemaBottomLeft$|async"></sudoku-board-preview>
        </div>
        <div class="print-page-area left-line bottom"
             [class.active]="(printDocument.activeArea$|async)===(pageId+'.3')"
             (click)="setActive(3)"
             fxFlex>
          <sudoku-board-preview [schema]="schemaBottomRight$|async"></sudoku-board-preview>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../../template.component.scss', './fourA4V.component.scss']
})
export class FourA4VComponent extends TemplateComponent {
  schemaTopLeft$: Observable<string>;
  schemaTopRight$: Observable<string>;
  schemaBottomLeft$: Observable<string>;
  schemaBottomRight$: Observable<string>;

  constructor() {
    super();
    this.schemaTopLeft$ = this.getSchema$(0);
    this.schemaTopRight$ = this.getSchema$(1);
    this.schemaBottomLeft$ = this.getSchema$(2);
    this.schemaBottomRight$ = this.getSchema$(3);

  }

  setActive(index: number) {
    this.printDocument.activeArea$.next(getPageArea(this.pageId, index));
  }
}
