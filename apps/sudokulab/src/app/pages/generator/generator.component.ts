import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {GENERATOR_DATA, GeneratorData, GeneratorWorkingInfo, getBoardStyle, SudokuLab} from '@sudokulab/model';
import {MatDialog} from '@angular/material/dialog';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {DestroyComponent} from "../../components/DestroyComponent";

@Component({
  selector: 'sudokulab-generator-page',
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneratorComponent extends DestroyComponent implements OnDestroy, AfterViewInit {
  @ViewChild('board') board: ElementRef|undefined = undefined;
  layout$: Observable<string>;
  layoutAlign$: Observable<string>;
  boardStyle$: Observable<any>;
  working$: Observable<string>;

  constructor(private _dialog: MatDialog,
              public sudokuLab: SudokuLab,
              @Inject(GENERATOR_DATA) public generator: GeneratorData) {
    super(sudokuLab);

    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    this.layoutAlign$ = this.compact$.pipe(map(iscompact => iscompact ? 'start center' : 'center'));
    // _sudoku
    //   .onUpload(UploadDialogComponent, this._destroy$)
    //   .subscribe(res => !!res ? _sudoku.loadSchema(res.sdk) : null);

    this.boardStyle$ = combineLatest([this._resize$, this._element$])
      .pipe(map(([r, ele]) => getBoardStyle(ele)));

    this.working$ = combineLatest([generator.running$, generator.workingInfo$]).pipe(
      map(([running, info]) => running ? getworkingInfo(info) : ''));

    sudokuLab.context$.next(this.generator);
  }

  ngAfterViewInit() {
    this._element$.next(this.board);
  }
}

const getworkingInfo = (info: GeneratorWorkingInfo): string => {

  // TODO: working info...

  return 'working...';
}
