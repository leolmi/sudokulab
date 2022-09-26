import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {AlgorithmResultLine, getAlgorithm, SolveStepResult} from "@sudokulab/model";
import {reduce as _reduce} from 'lodash';
import {map} from "rxjs/operators";

interface Line {
  num?: number;
  text: string;
  line?: AlgorithmResultLine;
}

@Component({
  selector: 'sudokulab-solver-step-details',
  template: `<div class="details-container">
    <div class="lines-header" [class.allow-close]="allowClose && ((lines$|async)||[]).length>0">
      <img *ngIf="showHelpImage" src="assets/images/board_num.png" alt="description image">
      <button *ngIf="allowClose && ((lines$|async)||[]).length>0" class="close-button"
              (click)="closeDetails()" mat-icon-button>
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <div class="lines-container">
      <div *ngFor="let line of lines$|async"
           class="detail-line"
           (click)="clickOnLine(line)"
           [class.result-line]="!!line.line && handleLines"
           fxLayout="row" fxLayoutAlign="start center">
        <div class="line-number" *ngIf="!!line.line">{{line.num}}</div>
        <div class="line-text" [class.title]="!line.line" fxFlex>{{line.text}}</div>
      </div>
    </div>
  </div>`,
  styleUrls: ['./solver-step-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolverStepDetailsComponent {
  steps$: BehaviorSubject<SolveStepResult[]>;
  lines$: Observable<Line[]>;

  @Input() handleLines: boolean = false;
  @Input() showHelpImage: boolean = true;
  @Input() allowClose: boolean = false;
  @Input() set steps(s: SolveStepResult[]) {
     this.steps$.next(s);
  }

  @Output() onLineCLick: EventEmitter<AlgorithmResultLine> = new EventEmitter<AlgorithmResultLine>();
  @Output() onClose: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
    let counter = 0;
    this.steps$ = new BehaviorSubject<SolveStepResult[]>([])

    this.lines$ = this.steps$.pipe(map(steps => _reduce(steps||[], (lns, step) => {
      const alg = getAlgorithm(step.result?.algorithm||'');
      return lns.concat([
        {text: alg?.name||'undefined',},
        ...(step.result?.descLines||[]).map(ln => ({
          num: ++counter,
          text: ln.description,
          line: ln
        }))]);
    }, <Line[]>[])));
  }

  closeDetails() {
    this.onClose.emit({});
  }

  clickOnLine(line: Line) {
    if (line.line && this.handleLines) this.onLineCLick.emit(line.line);
  }
}
