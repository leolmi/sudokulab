import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import {
  Cell,
  getBoardStyle,
  HandleImageResult,
  LabFacade, Sudoku,
  SUDOKU_DEFAULT_RANK,
  SudokuFacade,
  use
} from '@sudokulab/model';
import { MatDialog } from '@angular/material/dialog';
import { DestroyComponent } from '../../components/DestroyComponent';
import { UploadDialogComponent } from '../../components/upload-dialog/upload-dialog.component';
import { ImageHandlerComponent } from '../../components/image-handler/image-handler.component';
import { CameraDialogComponent } from '../../components/camera-dialog/camera-dialog.component';
import { SchemaCheckComponent } from '../../components/schema-check/schema-check.component';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, skip, take, takeUntil } from 'rxjs/operators';
import { Dictionary } from '@ngrx/entity';
import {SOLVER_STEP_DETAILS} from "../../model";
import {SolverStepDetailsComponent} from "../../components/solver-step-details/solver-step-details.component";

@Component({
  selector: 'sudokulab-lab-page',
  templateUrl: './lab.component.html',
  styleUrls: ['./lab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabComponent extends DestroyComponent implements OnDestroy, AfterViewInit {
  @ViewChild('board') board: ElementRef|undefined = undefined;
  progress$: Observable<number>;
  layout$: Observable<string>;
  layoutAlign$: Observable<string>;
  topToolFlex$: Observable<string>;
  boardStyle$: Observable<any>;
  cells$: Observable<Dictionary<Cell>>;
  isActiveCell$: Observable<boolean>;
  isPencil$: Observable<boolean>;
  rank$: Observable<number>;

  constructor(private _lab: LabFacade,
              private _route: ActivatedRoute,
              private _dialog: MatDialog,
              _sudoku: SudokuFacade) {
    super(_sudoku);
    this.cells$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$), map(sdk => sdk?.cells||{}));
    this.isActiveCell$ = _lab.selectActiveCell$.pipe(takeUntil(this._destroy$), map(cell => !!cell));
    this.isPencil$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$), map(sdk => !!sdk?.options?.usePencil));
    this.rank$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$), map(sdk => sdk?.sudoku?.rank||SUDOKU_DEFAULT_RANK));

    _sudoku
      .onUpload(UploadDialogComponent, this._destroy$, { allowOnlyValues: true, allowImages: true, allowEditOnGrid: true })
      .pipe(filter(res => res.editOnGrid || !!res?.sdk || !!res?.image))
      .subscribe(res => res.editOnGrid ?
        _sudoku.checkSchema(new HandleImageResult({ sdk: new Sudoku(), onlyValues: res.onlyValues })) :
        res.sdk ?
          _sudoku.loadSudoku(res.sdk, res.onlyValues) :
          _sudoku.handleImage(res));

    _sudoku.onCamera(CameraDialogComponent, this._destroy$);
    _sudoku.onHandleImage(ImageHandlerComponent, this._destroy$);
    _sudoku.onCheckSchema(SchemaCheckComponent, this._destroy$);

    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    this.layoutAlign$ = this.compact$.pipe(map(iscompact => iscompact ? 'start center' : 'center'));
    this.topToolFlex$ = this.compact$.pipe(map(iscompact => iscompact ? 'none' : '50'));
    this.progress$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$), map(sdk => sdk?.state.percent||0));

    this.boardStyle$ = combineLatest(this._resize$, this._element$)
      .pipe(map(([r, ele]) => getBoardStyle(ele)));

    _sudoku.doGenericAction = (code: string, data: any) => this._doAction(code, data);
  }

  private _doAction(code: string, data: any) {
    switch (code) {
      case SOLVER_STEP_DETAILS:
        this._dialog.open(SolverStepDetailsComponent, {
          width: '600px',
          panelClass: 'sudokulab-solver-step-details',
          data
        });
        break;
    }
  }

  ngAfterViewInit() {
    this._element$.next(this.board);
    this._sudoku.selectAllSchemas$
      .pipe(skip(1), take(1))
      .subscribe(schemas =>
        use(this._route.paramMap, gp => {
          const id = parseInt(gp.get('id') || '0', 10);
          setTimeout(() => id ? this._lab.setActiveSudoku(id) : this._sudoku.checkStatus(), 250);
        }));
  }

  ngOnDestroy() {
    delete this._sudoku.doGenericAction;
    super.ngOnDestroy();
  }

  keyPressed(num: string) {
    this._lab.setValue(num);
  }

  pencilChanged(pencil: boolean) {
    this._lab.updatePlayerOptions({ usePencil: pencil });
  }
}
