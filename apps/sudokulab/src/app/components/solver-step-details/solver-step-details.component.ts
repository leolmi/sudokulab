import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {AlgorithmResultLine, getAlgorithm, SolveStepResult, SudokuLab, update} from "@sudokulab/model";
import {reduce as _reduce} from 'lodash';
import {map, tap} from "rxjs/operators";
import {Dictionary} from "@ngrx/entity";

interface Line {
  num?: number;
  text: string;
  line?: AlgorithmResultLine;
  hidden?: boolean;
}

@Component({
  selector: 'sudokulab-solver-step-details',
  template: `<div class="details-container" fxLayout="column">
    <div class="lines-header" [class.allow-close]="allowClose && ((lines$|async)||[]).length>0">
      <img *ngIf="showHelpImage" src="assets/images/board_num.png" alt="description image">
      <button *ngIf="allowClose && ((lines$|async)||[]).length>0" class="close-button"
              (click)="closeDetails()" mat-icon-button>
        <mat-icon>highlight_off</mat-icon>
      </button>
    </div>
    <div class="lines-container"
         [fxFlex]="containerFlex$|async"
         [class.compact]="sudokuLab.state.isCompact$|async">
      <div class="lines-list-container">
        <div *ngFor="let line of lines$|async"
             class="detail-line"
             (click)="clickOnLine(line)"
             [class.result-line]="!!line.line && handleLines"
             [class.hidden-line]="!!line.line && line.hidden"
             [class.visible-line]="((visibles$|async)||{})[''+(line.num||'')]"
             fxLayout="row" fxLayoutAlign="start center">
          <div class="line-number" *ngIf="!!line.line">{{line.num}}</div>
          <div class="line-text" [class.title]="!line.line" fxFlex>{{line.text}}</div>
        </div>
      </div>
    </div>
  </div>`,
  styleUrls: ['./solver-step-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolverStepDetailsComponent {
  steps$: BehaviorSubject<SolveStepResult[]>;
  lines$: Observable<Line[]>;
  visibles$: BehaviorSubject<Dictionary<boolean>>;
  containerFlex$: Observable<string>;

  @Input() handleLines: boolean = false;
  @Input() showHelpImage: boolean = true;
  @Input() allowClose: boolean = false;
  @Input() set steps(s: SolveStepResult[]) {
     this.steps$.next(s);
     this.visibles$.next({});
  }

  @Output() onLineCLick: EventEmitter<AlgorithmResultLine> = new EventEmitter<AlgorithmResultLine>();
  @Output() onClose: EventEmitter<any> = new EventEmitter<any>();

  constructor(public sudokuLab: SudokuLab) {
    this.visibles$ = new BehaviorSubject<any>({});
    this.steps$ = new BehaviorSubject<SolveStepResult[]>([])
    this.containerFlex$ = sudokuLab.state.isCompact$.pipe(map(cmp => cmp ? 'none' : '100'))

    this.lines$ = this.steps$.pipe(
      map(steps => {
        let counter = 0;
        return _reduce(steps||[], (lns, step) => {
          const alg = getAlgorithm(step.result?.algorithm||'');
          return lns.concat([
            {text: alg?.name||'undefined',},
            ...(step.result?.descLines||[]).map(ln => ({
              num: ++counter,
              text: ln.description,
              line: ln,
              hidden: ln.withValue
            }))]);
        }, <Line[]>[])
      }));
  }

  closeDetails() {
    this.onClose.emit({});
  }

  clickOnLine(line: Line) {
    this.visibles$.next({ ...this.visibles$.value, [`${line.num||''}`]: true });
    if (line.line && this.handleLines) this.onLineCLick.emit(line.line);
  }
}
