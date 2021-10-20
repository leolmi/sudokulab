import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { GeneratorBaseComponent } from '../../components/GeneratorBaseComponent';
import { GeneratorFacade, getBoardStyle, SudokuFacade, WorkingInfo } from '@sudokulab/model';
import { UploadDialogComponent } from '../../components/upload-dialog/upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AvailablePages } from '../../model';

@Component({
  selector: 'sudokulab-generator-page',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorComponent extends GeneratorBaseComponent implements OnDestroy, AfterViewInit {
  @ViewChild('board') board: ElementRef|undefined = undefined;
  layout$: Observable<string>;
  layoutAlign$: Observable<string>;
  boardStyle$: Observable<any>;
  working$: Observable<WorkingInfo|undefined>;
  constructor(private _generator: GeneratorFacade,
              private _dialog: MatDialog,
              _sudoku: SudokuFacade) {
    super(_generator, _sudoku);
    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    this.layoutAlign$ = this.compact$.pipe(map(iscompact => iscompact ? 'start center' : 'center'));
    _sudoku
      .onUpload(UploadDialogComponent, this._destroy$)
      .subscribe(res => !!res ? _sudoku.loadSchema(res.sdk) : null);

    this.boardStyle$ = combineLatest(this._resize$, this._element$)
      .pipe(map(([r, ele]) => getBoardStyle(ele)));

    this.working$ = combineLatest(this.running$, _generator.selectGeneratorWorkingInfo$).pipe(
      map(([running, info]) => running ? info : undefined));
  }

  ngAfterViewInit() {
    this._element$.next(this.board);
  }
}
