import {ChangeDetectionStrategy, Component} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {SudokuLab} from "@sudokulab/model";
import {DEFAULT_LAB_BUTTONS} from "../../model";

interface ButtonInfo {
  tooltip: string;
  icon: string;
  code: string;
  disabledKey?: string;
  checkedKey?: string;
}

@Component({
  selector: 'sudokulab-operations-bar',
  template: `
    <div class="operations-bar" fxLayout="row" fxLayoutAlign="start center">
      <mat-icon class="icon-button"
                *ngFor="let btn of (lbuttons$|async)"
                [matTooltip]="btn.tooltip"
                (click)="execute(btn)"
                [class.color-accent]="!!((sudokuLab.state.pagesStatus$|async)||{})[btn?.checkedKey||'']"
                [class.disabled]="!!((sudokuLab.state.pagesStatus$|async)||{})[btn?.disabledKey||'']"
      >{{btn.icon}}</mat-icon>
      <div fxFlex></div>
      <mat-icon class="icon-button"
                *ngFor="let btn of (rbuttons$|async)"
                [matTooltip]="btn.tooltip"
                (click)="execute(btn)"
                [class.color-accent]="!!((sudokuLab.state.pagesStatus$|async)||{})[btn?.checkedKey||'']"
                [class.disabled]="!!((sudokuLab.state.pagesStatus$|async)||{})[btn?.disabledKey||'']"
      >{{btn.icon}}</mat-icon>
    </div>`,
  styleUrls: ['./operations-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationsBarComponent {
  rbuttons$: BehaviorSubject<ButtonInfo[]>;
  lbuttons$: BehaviorSubject<ButtonInfo[]>;

  constructor(public sudokuLab: SudokuLab) {
    this.lbuttons$ = new BehaviorSubject<ButtonInfo[]>([
      DEFAULT_LAB_BUTTONS.stepinfo,
      DEFAULT_LAB_BUTTONS.step
    ]);
    this.rbuttons$ = new BehaviorSubject<ButtonInfo[]>([
      DEFAULT_LAB_BUTTONS.available,
      DEFAULT_LAB_BUTTONS.popupdetails
    ]);
  }

  execute(btn: ButtonInfo) {
    this.sudokuLab.internalCode$.next(btn?.code);

    // switch (btn?.code) {
      // case 'step': return this._lab.solveStep();
      // case 'stepinfo': return this._lab.stepInfo();
      // case 'available': return this._lab.toggleAvailable();
      // case 'popupdetails': return this._lab.togglePopupDetails();
    // }
  }
}
