import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlaySudoku } from '@sudokulab/model';

@Component({
  selector: 'sudokulab-schemas-item',
  template: `<div (click)="clickOnItem()"
                  class="schemas-item"
                  [ngClass]="{'color-primary': active, 'color-accent': selected && !active}"
                  fxLayout="row" fxLayoutAlign="start center">
    <svg-board class="thumbnail" [sudoku]="schema?.sudoku"></svg-board>
    <div class="schema-name" fxFlex>{{schema | schemaName}}</div>
<!--    <div class="hash">{{schema?.sudoku?._id||''}}</div>-->
    <div class="hash-container">
      <div class="hash">{{schema?.sudoku?.fixed||''}}</div>
    </div>
  </div>`,
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasItemComponent {
  @Input() schema: PlaySudoku|undefined = undefined;
  @Input() active: boolean = false;
  @Input() selected: boolean = false;
  @Output() onClick: EventEmitter<PlaySudoku> = new EventEmitter<PlaySudoku>();

  constructor() {
  }

  clickOnItem() {
    this.onClick.emit(this.schema);
  }
}
