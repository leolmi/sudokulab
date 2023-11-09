import {ChangeDetectionStrategy, Component} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {ButtonInfo, SudokuLab} from "@sudokulab/model";
import {AvailablePages, DEFAULT_LAB_BUTTONS} from "../../model";
import {map} from "rxjs/operators";

@Component({
  selector: 'sudokulab-operations-bar',
  template: `
    <div class="operations-bar" fxLayout="row" fxLayoutAlign="start center">
      <mat-icon class="icon-button"
                *ngFor="let btn of (lbuttons$|async)"
                [matTooltip]="btn.tooltip||''"
                (click)="execute(btn)"
                [class.color-accent]="!!((status$|async)||{})[btn?.checkedKey||'']"
                [class.disabled]="!!((status$|async)||{})[btn?.disabledKey||'']"
      >{{btn.icon}}</mat-icon>
      <div fxFlex></div>
      <mat-icon class="icon-button"
                *ngFor="let btn of (rbuttons$|async)"
                [matTooltip]="btn.tooltip||''"
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
  status$: Observable<any>;

  constructor(public sudokuLab: SudokuLab) {
    this.status$ = sudokuLab.state.pagesStatus$.pipe(map(s => (s||{})[AvailablePages.lab]||{}));
    this.lbuttons$ = new BehaviorSubject<ButtonInfo[]>([
      DEFAULT_LAB_BUTTONS.stepinfo,
      DEFAULT_LAB_BUTTONS.step
    ]);
    this.rbuttons$ = new BehaviorSubject<ButtonInfo[]>([
      DEFAULT_LAB_BUTTONS.available
    ]);
  }

  execute(btn: ButtonInfo) {
    this.sudokuLab.internalCode$.next(`lab.${btn?.code}`);
  }
}
