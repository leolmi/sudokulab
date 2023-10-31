import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {
  AlgorithmResultLine,
  BOARD_DATA,
  BoardData,
  Cell,
  getBoardStyle,
  PlaySudoku,
  SolveStepResult,
  SUDOKU_DEFAULT_RANK,
  SudokuLab
} from '@sudokulab/model';
import {MatDialog} from '@angular/material/dialog';
import {DestroyComponent} from '../../components/DestroyComponent';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {Dictionary} from '@ngrx/entity';
import {SOLVER_STEP_DETAILS} from "../../model";
import {SolverStepDetailsPopupComponent} from "../../components/solver-step-details/solver-step-details-popup.component";
import {reduce as _reduce} from 'lodash';

@Component({
  selector: 'sudokulab-lab-page',
  templateUrl: './lab.component.html',
  styleUrls: ['./lab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabComponent extends DestroyComponent implements OnDestroy, AfterViewInit {
  @ViewChild('board') board: ElementRef|undefined = undefined;

  private _sudoku$: Observable<PlaySudoku|undefined>;
  progress$: Observable<number>;
  layout$: Observable<string>;
  layoutAlign$: Observable<string>;
  topToolFlex$: Observable<string>;
  boardStyle$: Observable<any>;
  cells$: Observable<Dictionary<Cell>>;
  isActiveCell$: Observable<boolean>;
  isPencil$: Observable<boolean>;
  isShowDetails$: Observable<boolean>;
  rank$: Observable<number>;


  highlight$: BehaviorSubject<Dictionary<boolean>>;
  otherHighlight$: BehaviorSubject<Dictionary<boolean>>;
  isWorkerAvailable$: BehaviorSubject<boolean>;

  constructor(public sudokuLab: SudokuLab,
              private _route: ActivatedRoute,
              private _dialog: MatDialog,
              @Inject(BOARD_DATA) public boardData: BoardData) {
    super(sudokuLab);
    this._sudoku$ = of(undefined); // _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$));
    this.isWorkerAvailable$ = new BehaviorSubject<boolean>(boardData.isWorkerAvailable);
    this.cells$ = this._sudoku$.pipe(map(sdk => sdk?.cells || {}));
    this.isPencil$ = this._sudoku$.pipe(map(sdk => !!sdk?.options?.usePencil));
    this.isShowDetails$ = this._sudoku$.pipe(map(sdk => !sdk?.options?.showPopupDetails));
    this.rank$ = this._sudoku$.pipe(map(sdk => sdk?.sudoku?.rank || SUDOKU_DEFAULT_RANK));
    this.isActiveCell$ = of(false); // _lab.selectActiveCell$.pipe(takeUntil(this._destroy$), map(cell => !!cell));
    this.highlight$ = new BehaviorSubject<Dictionary<boolean>>({});
    this.otherHighlight$ = new BehaviorSubject<Dictionary<boolean>>({});

    sudokuLab.context$.next(this.boardData);
    // _sudoku
    //   .onUpload(UploadDialogComponent, this._destroy$, {
    //     allowOnlyValues: true,
    //     allowImages: true,
    //     allowEditOnGrid: true
    //   })
    //   .pipe(filter(res => res.editOnGrid || !!res?.sdk || !!res?.image))
    //   .subscribe(res => res.editOnGrid ?
    //     _sudoku.checkSchema(new HandleImageResult({sdk: new Sudoku(), onlyValues: res.onlyValues})) :
    //     (res.sdk ?
    //       _sudoku.loadSudoku(res.sdk, res.onlyValues) :
    //       _sudoku.handleImage(res)));
    //
    // _sudoku.onCamera(CameraDialogComponent, this._destroy$);
    // _sudoku.onHandleImage(ImageHandlerComponent, this._destroy$);
    // _sudoku.onCheckSchema(SchemaCheckComponent, this._destroy$);

    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    this.layoutAlign$ = this.compact$.pipe(map(iscompact => iscompact ? 'start center' : 'center'));
    this.topToolFlex$ = this.compact$.pipe(map(iscompact => iscompact ? 'none' : '50'));
    this.progress$ = of(0);
    // this.progress$ = combineLatest([_lab.selectActiveSudoku$, boardData.sdk$]).pipe(
    //   takeUntil(this._destroy$),
    //   map(([sdk, wsdk]) => boardData.isWorkerAvailable ?
    //     wsdk?.state.percent || 0 :
    //     sdk?.state.percent || 0));

    this.boardStyle$ = combineLatest([this._resize$, this._element$])
      .pipe(map(([r, ele]) => getBoardStyle(ele)));

    // _sudoku.doGenericAction = (code: string, data: any) => this._doAction(code, data);
    //
    // _lab.schemaChanged$.pipe(
    //   takeUntil(this._destroy$))
    //   .subscribe(() => this.closeDetails());

    this.sudokuLab.state.activePlaySudoku$.pipe(
      takeUntil(this._destroy$),
      filter(sdk => !!sdk),
      debounceTime(250),
      distinctUntilChanged((s1, s2) => s1?.id === s2?.id))
      .subscribe(sdk => boardData.sdk$.next(sdk || new PlaySudoku()));
  }

  private _doAction(code: string, data: any) {
    switch (code) {
      case SOLVER_STEP_DETAILS:
        this._dialog.open(SolverStepDetailsPopupComponent, {
          width: '600px',
          panelClass: 'sudokulab-solver-step-details',
          data
        });
        break;
    }
  }

  ngAfterViewInit() {
    this._element$.next(this.board);
    // this._sudoku.selectAllSchemas$
    //   .pipe(skip(1), take(1))
    //   .subscribe(schemas =>
    //     use(this._route.paramMap, gp => {
    //       const id = parseInt(gp.get('id') || '0', 10);
    //       setTimeout(() => id ? this._lab.setActiveSudoku(id) : this._sudoku.checkStatus(), 250);
    //     }));
  }

  ngOnDestroy() {
    // delete this._sudoku.doGenericAction;
    super.ngOnDestroy();
  }

  keyPressed(num: string) {
    // this._lab.setValue(num);
  }

  // pencilChanged(pencil: boolean) {
  //   use(combineLatest([this.cells$, this._sudoku$]), ([cells, sdk]) => {
  //     if (pencil && isPencilEmpty(cells) && sdk?.options?.showAvailables) {
  //       // console.log('ASK IF WANT TO PASS AVAILABLES TO PENCIL');
  //       this._dialog
  //         .open(AskDialogComponent, {
  //           width: '600px',
  //           data: { message: 'Do you want to copy all available values into the pencils?' }
  //         })
  //         .afterClosed()
  //         .pipe(filter(res => !!res))
  //         .subscribe(() => this._lab.copyAvailableToPencil())
  //     }
  //     this._lab.updatePlayerOptions({usePencil: pencil});
  //   });
  // }

  stepLineClick(line: AlgorithmResultLine) {
    if (this.boardData.isWorkerAvailable) this.boardData.info$.next(line);
    if (!!line?.cell) this.highlight$.next({ [line?.cell]: true });
    this.otherHighlight$.next(_reduce(line?.others||[], (d, os) => ({ ...d, [os]: true }) , {}));
  }

  closeDetails() {
    this.sudokuLab.state.stepInfos$.next([]);
  }
}
