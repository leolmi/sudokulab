import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  ViewChild
} from '@angular/core';
import {
  GENERATOR_DATA,
  GeneratorData,
  GeneratorDataManager,
  GeneratorWorkingInfo,
  getBoardStyle,
  SudokuLab
} from '@sudokulab/model';
import {MatDialog} from '@angular/material/dialog';
import {combineLatest, Observable} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {DestroyComponent} from "../../components/DestroyComponent";
import {AvailablePages, DEFAULT_GENERATOR_PAGE_STATUS} from "../../model";

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
              private _zone: NgZone,
              public sudokuLab: SudokuLab,
              @Inject(GENERATOR_DATA) public generator: GeneratorData) {
    super(sudokuLab);

    if (!generator.manager) {
      generator.manager = new GeneratorDataManager(_zone, sudokuLab, generator, { saveDataOnChanges: true });
    }

    this.layout$ = this.compact$.pipe(map(iscompact => iscompact ? 'column' : 'row'));
    this.layoutAlign$ = this.compact$.pipe(map(iscompact => iscompact ? 'start center' : 'center'));

    this.boardStyle$ = combineLatest([this._resize$, this._element$])
      .pipe(map(([r, ele]) => getBoardStyle(ele)));

    this.working$ = combineLatest([generator.running$, generator.workingInfo$]).pipe(
      map(([running, info]) => running ? getworkingInfo(info) : ''));

    sudokuLab.context$.next(this.generator);

    generator.manager.changed$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.sudokuLab.updatePageStatus(this._getPageStatus()))
  }

  private _getPageStatus(): any {
    return {
      [AvailablePages.generator]: {
        [DEFAULT_GENERATOR_PAGE_STATUS.gen_running]: this.generator.running$.value,
        [DEFAULT_GENERATOR_PAGE_STATUS.gen_not_running]: !this.generator.running$.value,
        [DEFAULT_GENERATOR_PAGE_STATUS.has_no_schemas]: (this.generator.schemas$.value || []).length < 1,
        [DEFAULT_GENERATOR_PAGE_STATUS.has_no_gen_schema]: !this.generator.schema$.value,
      }
    }
  }

  ngAfterViewInit() {
    this._element$.next(this.board);
    this.generator.manager?.init(() => new Worker(new URL('./generator.worker', import.meta.url)));
  }
}

const getworkingInfo = (info: GeneratorWorkingInfo): string => {

  // TODO: working info...

  return 'working...';
}
