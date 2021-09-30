import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {
  cellId,
  getCellStyle,
  getDimension, getLinesGroups, getSchemaCellStyle,
  isDirectionKey,
  LabFacade,
  SudokuFacade, SudokulabWindowService,
  SudokuSchema,
  use
} from '@sudokulab/model';
import { DestroyComponent } from '../DestroyComponent';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';

@Component({
  selector: 'sudokulab-schema',
  templateUrl: './sudoku-schema.component.html',
  styleUrls: ['./sudoku-schema.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SudokuSchemaComponent extends DestroyComponent implements OnDestroy, AfterViewInit {
  private readonly _resize$: BehaviorSubject<any>;
  @ViewChild('schemaElement') schemaElement: ElementRef|undefined = undefined;
  schema: SudokuSchema;
  selected$: Observable<string>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  cellStyle$: Observable<any>;
  grline$: Observable<{[id: number]: boolean}>;
  element$: BehaviorSubject<ElementRef|undefined>;

  constructor(private _ele: ElementRef,
              private _lab: LabFacade,
              private _window: SudokulabWindowService,
              _sudoku: SudokuFacade) {
    super(_sudoku);
    this._resize$ = new BehaviorSubject<any>({});
    this.element$ = new BehaviorSubject<ElementRef|undefined>(undefined);
    this.schema = new SudokuSchema();
    this.selected$ = _lab.selectActiveCell$.pipe(takeUntil(this._destroy$));
    this.rows$ = of(this.schema).pipe(map(s => getDimension(s?.rank)));
    this.cols$ = of(this.schema).pipe(map(s => getDimension(s?.rank)));
    this.cellStyle$ = combineLatest(this._resize$, this.element$).pipe(map(([r, ele]) =>
      getSchemaCellStyle(this.schema.rank, ele?.nativeElement?.clientWidth||200)));


    this.grline$ = of(this.schema).pipe(map(s => getLinesGroups(s.rank)));

      _lab.selectActiveSudoku$
      .pipe(
        takeUntil(this._destroy$),
        map(ps => ps?.sudoku),
        filter(sdk => !!sdk),
        distinctUntilChanged((s1, s2) => s1?.fixed === s2?.fixed))
      .subscribe(sdk => {
        this.schema.clear(true);
        this.schema.loadFixed(sdk?.fixed);
      });
  }

  ngAfterViewInit() {
    this.element$.next(this.schemaElement);
  }

  @HostListener('window:resize')
  resize() {
    this._resize$.next({});
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    if (isDirectionKey(e?.key)) {
      this._lab.move(e?.key);
      e.stopPropagation();
      e.preventDefault();
    } else {
      use(this.selected$, id => this.schema.setValue(id, e?.key));
    }
  }

  select(col: number, row: number) {
    this._lab.setActiveCell(cellId(col, row));
  }

  repaint() {
    this._resize$.next({});
  }
}
