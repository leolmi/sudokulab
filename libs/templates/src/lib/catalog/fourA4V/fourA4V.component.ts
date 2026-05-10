import { TemplateComponent } from '../../template.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { getPageArea } from '@olmi/model';
import { BoardPreviewComponent } from '@olmi/board';

@Component({
  selector: 'print-page-template-four-a4v',
  standalone: true,
  imports: [BoardPreviewComponent],
  template: `
    @let area = activeArea();
    <div class="print-template-container flex-col">
      <div class="flex-row flex-align-start-stretch flex-1">
        <div class="print-page-area top flex-1"
             [class.active]="area === pageId + '.0'"
             (click)="setActive(0)">
          <sudoku-board-preview [schema]="schemaTopLeft()"></sudoku-board-preview>
        </div>
        <div class="print-page-area left-line bottom flex-1"
             [class.active]="area === pageId + '.1'"
             (click)="setActive(1)">
          <sudoku-board-preview [schema]="schemaTopRight()"></sudoku-board-preview>
        </div>
      </div>
      <div class="top-line flex-row flex-align-start-stretch flex-1">
        <div class="print-page-area top flex-1"
             [class.active]="area === pageId + '.2'"
             (click)="setActive(2)">
          <sudoku-board-preview [schema]="schemaBottomLeft()"></sudoku-board-preview>
        </div>
        <div class="print-page-area left-line bottom flex-1"
             [class.active]="area === pageId + '.3'"
             (click)="setActive(3)">
          <sudoku-board-preview [schema]="schemaBottomRight()"></sudoku-board-preview>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../../template.component.scss', './fourA4V.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FourA4VComponent extends TemplateComponent {
  protected readonly schemaTopLeft = this.getSchema(0);
  protected readonly schemaTopRight = this.getSchema(1);
  protected readonly schemaBottomLeft = this.getSchema(2);
  protected readonly schemaBottomRight = this.getSchema(3);

  setActive(index: number) {
    this.printDocument.setActiveArea(getPageArea(this.pageId, index));
  }
}
