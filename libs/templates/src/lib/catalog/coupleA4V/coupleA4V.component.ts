import { TemplateComponent } from '../../template.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { getPageArea } from '@olmi/model';
import { BoardPreviewComponent } from '@olmi/board';

@Component({
  selector: 'print-page-template-couple-a4v',
  standalone: true,
  imports: [BoardPreviewComponent],
  template: `
    @let area = activeArea();
    <div class="print-template-container flex-col">
      <div class="print-page-area top flex-1"
           [class.active]="area === pageId + '.0'"
           (click)="setActive(0)">
        <sudoku-board-preview [schema]="schemaTop()"></sudoku-board-preview>
      </div>
      <div class="print-page-area top-line bottom flex-1"
           [class.active]="area === pageId + '.1'"
           (click)="setActive(1)">
        <sudoku-board-preview [schema]="schemaBottom()"></sudoku-board-preview>
      </div>
    </div>
  `,
  styleUrls: ['../../template.component.scss', './coupleA4V.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoupleA4VComponent extends TemplateComponent {
  protected readonly schemaTop = this.getSchema(0);
  protected readonly schemaBottom = this.getSchema(1);

  setActive(index: number) {
    this.printDocument.activeArea$.next(getPageArea(this.pageId, index));
  }
}
