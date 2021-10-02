import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { getBoardStyle, LabFacade, SudokuFacade } from '@sudokulab/model';
import { DestroyComponent } from '../../components/DestroyComponent';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialogComponent } from '../../components/upload-dialog/upload-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'sudokulab-lab-page',
  templateUrl: './lab.component.html',
  styleUrls: ['./lab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabComponent extends DestroyComponent implements OnInit, OnDestroy, AfterViewInit {
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
      .onUpload(UploadDialogComponent, this._destroy$)
      .subscribe(sdk => !!sdk ? _lab.loadSudoku(sdk) : null);
    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    this.layoutAlign$ = this.compact$.pipe(map(iscompact => iscompact ? 'start center' : 'center'));
    this.topToolFlex$ = this.compact$.pipe(map(iscompact => iscompact ? 'none' : '50'));
    this.progress$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$), map(sdk => sdk?.state.percent||0));

    this.boardStyle$ = combineLatest(this._resize$, this._element$)
      .pipe(map(([r, ele]) => getBoardStyle(ele)));
  }

  ngAfterViewInit() {
    this._element$.next(this.board);
  }

  ngOnInit() {
    this._route.paramMap.subscribe(qp => {
      const id = qp.get('id');
      if (!!id) setTimeout(() => this._lab.setActiveSudoku(parseInt(id, 10)), 250);
    });
  }
}
