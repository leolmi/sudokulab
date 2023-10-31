import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  BoardData,
  Cell,
  cellId,
  getDimension,
  getLinesGroups,
  getSchemaCellStyle,
  handleKeyEvent,
  PlaySudoku,
  SUDOKU_DEFAULT_RANK,
  SudokulabWindowService
} from '@sudokulab/model';
import {map, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable, of, Subject} from 'rxjs';
import {Dictionary} from '@ngrx/entity';


@Component({
  selector: 'sudokulab-schema',
  templateUrl: './sudoku-schema.component.html',
  styleUrls: ['./sudoku-schema.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SudokuSchemaComponent implements OnInit, AfterViewInit {
  private readonly _resize$: BehaviorSubject<any>;
  private readonly _destroy$: Subject<void>;

  @ViewChild('schemaElement') set schemaElement(e: ElementRef) {
    this.element$.next(e);
  };

  sdk$: BehaviorSubject<PlaySudoku>;
  selected$: BehaviorSubject<string>;
  rows$: Observable<number[]> = of([]);
  cols$: Observable<number[]> = of([]);
  cellStyle$: Observable<any>;
  cells$: Observable<Dictionary<Cell>>;
  gridLine$: Observable<{[id: number]: boolean}> = of({});
  element$: BehaviorSubject<ElementRef|undefined>;

  @Input()
  boardData: BoardData = new BoardData();

  constructor(private _ele: ElementRef,
              private _window: SudokulabWindowService) {
    this._destroy$ = new Subject<void>()
    this._resize$ = new BehaviorSubject<any>({});
    this.sdk$ = new BehaviorSubject<PlaySudoku>(new PlaySudoku());
    this.element$ = new BehaviorSubject<ElementRef|undefined>(undefined);

    this.selected$ = new BehaviorSubject<string>('');
    this.cells$ = this.sdk$.pipe(map(s => s?.cells||{}));
    this.rows$ = this.sdk$.pipe(map(s => getDimension(s?.sudoku?.rank||SUDOKU_DEFAULT_RANK)));
    this.cols$ = this.sdk$.pipe(map(s => getDimension(s?.sudoku?.rank||SUDOKU_DEFAULT_RANK)));
    this.gridLine$ = this.sdk$.pipe(map(s => getLinesGroups(s?.sudoku?.rank||SUDOKU_DEFAULT_RANK)));

    this.cellStyle$ = combineLatest([this._resize$, this.element$, this.sdk$])
      .pipe(map(([r, ele, sdk]) =>
        getSchemaCellStyle(sdk?.sudoku?.rank||SUDOKU_DEFAULT_RANK, ele?.nativeElement?.clientWidth||200)));
  }

  ngOnInit() {
    this.boardData.sdk$.pipe(takeUntil(this._destroy$)).subscribe(sdk => this.sdk$.next(sdk));
    this.boardData.activeCellId$.pipe(takeUntil(this._destroy$)).subscribe(cid => this.selected$.next(cid));
  }

  ngAfterViewInit() {
    setTimeout(() => this._resize$.next({}), 250);
  }

  @HostListener('window:resize')
  resize() {
    this._resize$.next({});
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    handleKeyEvent(this.boardData, e);
  }

  select(col: number, row: number) {
    this.selected$.next(cellId(col, row));
  }

  repaint() {
    this._resize$.next({});
  }
}
