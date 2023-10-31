import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {PlaySudoku, Sudoku} from '@sudokulab/model';

@Component({
  selector: 'sudokulab-schemas-item',
  template: `<div (click)="clickOnItem()"
                  class="schemas-item"
                  [class.has-changes]="!!hasChanges"
                  [class.color-primary]="active"
                  [class.color-accent]="selected&&!active"
                  fxLayout="row" fxLayoutAlign="start center">
    <svg-board class="thumbnail" [sudoku]="schema"></svg-board>
    <div class="schema-name" fxFlex>
      <div class="name">{{schema | schemaName}}</div>
    </div>
    <div class="difficulty">{{schema?.info?.difficultyValue||''}}</div>
    <div class="hash-container">
      <div class="hash">{{schema?.fixed||''}}</div>
    </div>
  </div>`,
  styleUrls: ['./schemas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemasItemComponent {
  @Input() schema: Sudoku|undefined = undefined;
  @Input() active: boolean = false;
  @Input() selected: boolean = false;
  @Input() hasChanges: boolean = false;

  @Output() onClick: EventEmitter<Sudoku> = new EventEmitter<Sudoku>();

  constructor() {
  }

  clickOnItem() {
    this.onClick.emit(this.schema);
  }
}
