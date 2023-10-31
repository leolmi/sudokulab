import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {
  cellId,
  clearEvent,
  GENERATOR_DATA,
  GeneratorData,
  getDimension,
  getLinesGroups,
  isDirectionKey,
  moveOnDirection,
  SUDOKU_DEFAULT_RANK,
  SUDOKU_DYNAMIC_VALUE,
  SudokuLab,
} from '@sudokulab/model';
import {map} from 'rxjs/operators';
import {DestroyComponent} from '../DestroyComponent';

@Component({
  selector: 'sudokulab-generator-board',
  templateUrl: './generator-board.component.html',
  styleUrls: ['./generator-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratorBoardComponent extends DestroyComponent implements OnDestroy {
  @ViewChild('board') set board(e: ElementRef|undefined) {
    this._element$.next(e);
  };

  cellStyle$: Observable<any>;
  rows$: Observable<number[]>;
  cols$: Observable<number[]>;
  gridLine$: Observable<{ [id: number]: boolean }>;
  hasFocus$: BehaviorSubject<boolean>;
  DYNAMIC = SUDOKU_DYNAMIC_VALUE;
  RANK = SUDOKU_DEFAULT_RANK;
  PROXYVALUE: any = { x: '?' };

  constructor(public sudokuLab: SudokuLab,
              @Inject(GENERATOR_DATA) public generator: GeneratorData) {
    super(sudokuLab);

    this.hasFocus$ = new BehaviorSubject<boolean>(false);
    this.rows$ = generator.sdk$.pipe(
      map((s) => getDimension(s?.sudoku?.rank || SUDOKU_DEFAULT_RANK))
    );
    this.cols$ = generator.sdk$.pipe(
      map((s) => getDimension(s?.sudoku?.rank || SUDOKU_DEFAULT_RANK))
    );
    this.gridLine$ = generator.sdk$.pipe(
      map((s) => getLinesGroups(s?.sudoku?.rank || SUDOKU_DEFAULT_RANK))
    );

    this.cellStyle$ = of({});

    // this.cellStyle$ = combineLatest([generator.sdk$, this._element$, this._resize$]).pipe(
    //   filter(([sdk, ele]) => !!sdk && !!ele?.nativeElement),
    //   // debounceTime(1000),
    //   map(([sdk, ele]) =>
    //     getSchemaCellStyle(sdk?.options?.rank || SUDOKU_DEFAULT_RANK, ele?.nativeElement?.clientWidth || 600)));
    //
    // this.cellStyle$.subscribe(cs => console.log('CELL STYLE', cs));

    // setTimeout(() => {
    //   this.cellStyle$ = combineLatest([generator.sdk$, this._element$, this._resize$]).pipe(
    //     filter(([sdk, ele]) => !!sdk && !!ele),
    //     map(([sdk, ele]) =>
    //       getSchemaCellStyle(sdk?.options?.rank || SUDOKU_DEFAULT_RANK, ele?.nativeElement?.clientWidth || 600)));
    // }, 2000);

    // this.cellStyle$ = combineLatest([generator.sdk$, this._element$, this._resize$]).pipe(
    //   map(([sdk, ele]) =>
    //     getSchemaCellStyle(sdk?.options?.rank || SUDOKU_DEFAULT_RANK, ele?.nativeElement?.clientWidth || 600)));

    // generator.sdk$.subscribe(sdk => console.log('[1] SDK rank', sdk?.options?.rank||SUDOKU_DEFAULT_RANK));
    // this._element$.subscribe(ele => console.log('[2] ELE clientWidth', ele?.nativeElement?.clientWidth || 600));
    // this._resize$.subscribe(res => console.log('[3] RESIZE'));
  }

  // focus(status = true) {
  //   use(this.generator.running$, (running) => {
  //     if (running) return;
  //     // if (status) this.board?.nativeElement.focus();
  //     this.hasFocus$.next(status);
  //   });
  // }

  @HostListener('window:keyup', ['$event'])
  keyEvent(e: KeyboardEvent) {
    const sdk = this.generator.sdk$.value;
    if (this.generator.running$.value || !sdk) return;

    if (isDirectionKey(e?.key)) {
      clearEvent(e);
      const target = moveOnDirection(
        this.generator.activeCellId$.value,
        sdk.sudoku,
        e?.key
      );
      this.select(target?.col || 0, target?.row || 0);
    } else {
      this.generator.value$.next(e?.key);
    }
  }

  select(col: number, row: number) {
    if (this.generator.running$.value) return;
    this.generator.activeCellId$.next(cellId(col, row));
  }
}
