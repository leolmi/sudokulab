import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlaySudoku } from '@sudokulab/model';

@Component({
  selector: 'sudokulab-schemas-item',
  template: `<div (click)="clickOnItem()"
                  class="schemas-item"
                  [ngClass]="{'color-primary': active}"
                  fxLayout="row" fxLayoutAlign="start center">
    <div class="schema-name" fxFlex>{{schema | schemaName}}</div>
    <div class="hash">{{schema?.sudoku?._id||''}}</div>
  </div>`,
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasItemComponent {
  @Input() schema: PlaySudoku|undefined = undefined;
  @Input() active: boolean = false;
  @Output() onClick: EventEmitter<PlaySudoku> = new EventEmitter<PlaySudoku>();

  constructor() {
  }

  clickOnItem() {
    this.onClick.emit(this.schema);
  }
}