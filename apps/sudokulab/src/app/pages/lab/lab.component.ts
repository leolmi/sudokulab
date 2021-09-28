import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { LabFacade, SudokuFacade } from '@sudokulab/model';
import { DestroyComponent } from '../../components/DestroyComponent';
import { MatDialog } from '@angular/material/dialog';
import { UploadDialogComponent } from '../../components/upload-dialog/upload-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'sudokulab-lab-page',
  templateUrl: './lab.component.html',
  styleUrls: ['./lab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabComponent extends DestroyComponent implements OnInit, OnDestroy {
  progress$: Observable<number>;
  layout$: Observable<string>;

  constructor(private _lab: LabFacade,
              private _route: ActivatedRoute,
              private _dialog: MatDialog,
              _sudoku: SudokuFacade) {
    super(_sudoku);
    _sudoku
      .onUpload(UploadDialogComponent, this._destroy$)
      .subscribe(sdk => !!sdk ? _lab.loadSudoku(sdk) : null);
    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    this.progress$ = _lab.selectActiveSudoku$.pipe(takeUntil(this._destroy$), map(sdk => sdk?.state.percent||0));
  }

  ngOnInit() {
    this._route.paramMap.subscribe(qp => {
      const id = qp.get('id');
      if (!!id) setTimeout(() => this._lab.setActiveSudoku(parseInt(id, 10)));
    });
  }
}
