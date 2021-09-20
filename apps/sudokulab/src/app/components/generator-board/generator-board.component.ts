import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  getCellStyle,
  getLinesGroups,
  EditSudoku,
  GeneratorFacade,
  cellId,
  isDirectionKey,
  use, getDimension
} from '@sudokulab/model';
import { map, takeUntil, tap } from 'rxjs/operators';
import { GeneratorBaseComponent } from '../GeneratorBaseComponent';

@Component({
  selector: 'sudokulab-generator-board',
  templateUrl: './generator-board.component.html',
  styleUrls: ['./generator-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorBoardComponent extends GeneratorBaseComponent implements OnDestroy {
  @ViewChild('board') board: ElementRef | undefined;
  editSudoku$: Observable<EditSudoku|undefined>;
  selected$: Observable<string>;
  cellStyle$: Observable<any>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  grline$: Observable<{[id: number]: boolean}>;
  hasFocus$: BehaviorSubject<boolean>;
  PROXYVALUE: any = {x: '?'};
  constructor(private ele: ElementRef,
              private _generator: GeneratorFacade) {
    super(_generator);
    this.editSudoku$ = _generator.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.selected$ = _generator.selectActiveCell$.pipe(takeUntil(this._destroy$));
    this.hasFocus$ = new BehaviorSubject<boolean>(false);

    this.rows$ = this.editSudoku$.pipe(map(s => getDimension(s?.options?.rank)));
    this.cols$ = this.editSudoku$.pipe(map(s => getDimension(s?.options?.rank)));
    this.cellStyle$ = this.editSudoku$.pipe(map(s => getCellStyle(s?.options, ele)));
    this.grline$ = this.editSudoku$.pipe(map(s => getLinesGroups(s?.options)));

    this.hasFocus$.pipe(tap((v) => console.log('BOARD HAS FOCUS = ', v))).subscribe();
  }

  focus(status = true) {
    use(this.running$, (running) => {
      if (running) return;
      if (!!status) this.board?.nativeElement.focus();
      this.hasFocus$.next(status);
    });
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    use(this.running$, (running) => {
      if (running) return;
      if (!this.hasFocus$.getValue()) return;
      if (isDirectionKey(e?.key)) {
        this._generator.move(e?.key);
        e.stopPropagation();
        e.preventDefault();
      } else {
        this._generator.setValue(e?.key);
      }
    });
  }

  select(col: number, row: number) {
    use(this.running$, (running) => {
      if (running) return;
      this.focus()
      this._generator.setActiveCell(cellId(col, row));
    });
  }
}
