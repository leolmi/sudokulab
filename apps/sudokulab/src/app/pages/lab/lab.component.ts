import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CameraDialogResult, getBoardStyle, LabFacade, SudokuFacade, use } from '@sudokulab/model';
import { DestroyComponent } from '../../components/DestroyComponent';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialogComponent } from '../../components/upload-dialog/upload-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, skip, switchMap, take, takeUntil } from 'rxjs/operators';
import { ImageHandlerComponent } from '../../components/image-handler/image-handler.component';
import { CameraDialogComponent } from '../../components/camera-dialog/camera-dialog.component';
import { SchemaCheckComponent } from '../../components/schema-check/schema-check.component';

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

  constructor(private _lab: LabFacade,
              private _route: ActivatedRoute,
              private _dialog: MatDialog,
              _sudoku: SudokuFacade) {
    super(_sudoku);
    _sudoku
      .onUpload(UploadDialogComponent, this._destroy$, { allowOnlyValues: true, allowImages: true })
      .pipe(filter(res => !!res?.sdk || !!res?.image))
      .subscribe(res => res.sdk ?
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
  }

  ngAfterViewInit() {
    this._element$.next(this.board);
    this._lab.selectAllSchemas$
      .pipe(skip(1), take(1))
      .subscribe(schemas =>
        use(this._route.paramMap, gp => {
          const id = parseInt(gp.get('id') || '0', 10);
          setTimeout(() => id ? this._lab.setActiveSudoku(id) : this._sudoku.checkStatus(), 250);
        }));
  }
}
