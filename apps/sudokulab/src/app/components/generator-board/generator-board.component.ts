import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy} from "@angular/core";
import {Observable, Subject} from "rxjs";
import {cellId, getCellStyle, getLinesGroups, EditSudoku, GeneratorFacade} from "@sudokulab/model";
import {map, takeUntil} from "rxjs/operators";
import {DestroyComponent} from "../DestroyComponent";

@Component({
  selector: 'sudokulab-generator-board',
  templateUrl: './generator-board.component.html',
  styleUrls: ['./generator-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorBoardComponent extends DestroyComponent implements OnDestroy {
  editSudoku$: Observable<EditSudoku|undefined>;
  selected$: Observable<string>;
  cellStyle$: Observable<any>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  grline$: Observable<{[id: number]: boolean}>;

  constructor(private ele: ElementRef,
              private _generator: GeneratorFacade) {
    super();
    this.editSudoku$ = _generator.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = _generator.selectActiveCell$.pipe(takeUntil(this._destroy$));

    this.rows$ = this.editSudoku$.pipe(map(s => Array(s?.options?.rank||9).fill(0).map((x, i)=>i)));
    this.cols$ = this.editSudoku$.pipe(map(s => Array(s?.options?.rank||9).fill(0).map((x, i)=>i)));
    this.cellStyle$ = this.editSudoku$.pipe(map(s => ({})));  //getCellStyle(s?.sudoku, ele)));
    this.grline$ = this.editSudoku$.pipe(map(s => getLinesGroups(s?.options)));

  }

  select(col: number, row: number) {
    //this._generator.setActiveCell(cellId(col, row));
  }
}
