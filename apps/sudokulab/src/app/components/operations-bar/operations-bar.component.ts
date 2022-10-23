import {ChangeDetectionStrategy, Component} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {Dictionary} from "@ngrx/entity";
import {LabFacade, SudokuFacade} from "@sudokulab/model";
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
                [class.color-accent]="!!((status$|async)||{})[btn?.checkedKey||'']"
                [class.disabled]="!!((status$|async)||{})[btn?.disabledKey||'']"
      >{{btn.icon}}</mat-icon>
      <div fxFlex></div>
      <mat-icon class="icon-button"
                *ngFor="let btn of (rbuttons$|async)"
                [matTooltip]="btn.tooltip"
                (click)="execute(btn)"
                [class.color-accent]="!!((status$|async)||{})[btn?.checkedKey||'']"
                [class.disabled]="!!((status$|async)||{})[btn?.disabledKey||'']"
      >{{btn.icon}}</mat-icon>
    </div>`,
  styleUrls: ['./operations-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationsBarComponent {
  rbuttons$: BehaviorSubject<ButtonInfo[]>;
  lbuttons$: BehaviorSubject<ButtonInfo[]>;
  status$: Observable<Dictionary<boolean>>;

  constructor(private _lab: LabFacade,
              private _sudoku: SudokuFacade) {
    this.status$ = _sudoku.selectPageStatus$;
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
    switch (btn?.code) {
      case 'step': return this._lab.solveStep();
      case 'stepinfo': return this._lab.stepInfo();
      case 'available': return this._lab.toggleAvailable();
      case 'popupdetails': return this._lab.togglePopupDetails();
    }
  }
}
