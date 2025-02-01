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
  getBoardStyle,
  isEmptySchema, isNoTrySchema,
  PlaySudoku,
  SUDOKU_DEFAULT_RANK,
  SudokuLab
} from '@sudokulab/model';
import {MatDialog} from '@angular/material/dialog';
import {DestroyComponent} from '../../components/DestroyComponent';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators';
import {Dictionary} from '@ngrx/entity';
import {AvailablePages, DEFAULT_LAB_PAGE_STATUS} from "../../model";
import {reduce as _reduce} from 'lodash';

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
  rank$: Observable<number>;


  highlight$: BehaviorSubject<Dictionary<boolean>>;
  otherHighlight$: BehaviorSubject<Dictionary<boolean>>;
  isWorkerAvailable$: BehaviorSubject<boolean>;

  constructor(public sudokuLab: SudokuLab,
              private _route: ActivatedRoute,
              private _dialog: MatDialog,
              @Inject(BOARD_DATA) public boardData: BoardData) {
    super(sudokuLab);
    this.isWorkerAvailable$ = new BehaviorSubject<boolean>(boardData.isWorkerAvailable);
    this.rank$ = boardData.sdk$.pipe(map(sdk => sdk?.sudoku?.rank || SUDOKU_DEFAULT_RANK));
    this.highlight$ = new BehaviorSubject<Dictionary<boolean>>({});
    this.otherHighlight$ = new BehaviorSubject<Dictionary<boolean>>({});

    sudokuLab.context$.next(this.boardData);

    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    this.layoutAlign$ = this.compact$.pipe(map(iscompact => iscompact ? 'start center' : 'center'));
    this.topToolFlex$ = this.compact$.pipe(map(iscompact => iscompact ? 'none' : '50'));
    this.boardStyle$ = combineLatest([this._resize$, this._element$])
      .pipe(map(([r, ele]) => getBoardStyle(ele)));

    sudokuLab.state.activePlaySudoku$.pipe(
      takeUntil(this._destroy$),
      filter(sdk => !!sdk),
      debounceTime(250),
      distinctUntilChanged((s1, s2) => s1?.id === s2?.id))
      .subscribe(sdk => boardData.sdk$.next(sdk || new PlaySudoku()));

    this.boardData.sdk$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => sudokuLab.updatePageStatus(this._getPageStatus()));

    this.progress$ = this.boardData.sdk$.pipe(
      takeUntil(this._destroy$),
      map((sdk) => sdk?.state.percent||0));
  }

  private _getPageStatus(): any {
    const sdk = this.boardData.sdk$.value;
    return {
      [AvailablePages.lab]: {
        [DEFAULT_LAB_PAGE_STATUS.has_no_lab_schema]: isEmptySchema(sdk),
        [DEFAULT_LAB_PAGE_STATUS.not_available_camera]: true,
        [DEFAULT_LAB_PAGE_STATUS.has_no_try_schema]: isNoTrySchema(sdk),
        [DEFAULT_LAB_PAGE_STATUS.available_visible_checked]: !!sdk?.options?.showAvailables,
      }
    }
  }

  ngAfterViewInit() {
    this._element$.next(this.board);
    this.boardData.manager?.loadUserData();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  stepLineClick(line: AlgorithmResultLine) {
    if (this.boardData.isWorkerAvailable) this.boardData.info$.next(line);
    if (!!line?.cell) this.highlight$.next({ [line?.cell]: true });
    this.otherHighlight$.next(_reduce(line?.others||[], (d, os) => ({ ...d, [os]: true }) , {}));
  }

  closeDetails() {
    this.sudokuLab.state.stepInfos$.next([]);
  }
}
