import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { DestroyComponent } from '../../components/DestroyComponent';
import {
  LabFacade,
  PlaySudoku,
  PrintFacade,
  PrintPage,
  SudokuFacade,
  SudokulabWindowService,
  use
} from '@sudokulab/model';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { cloneDeep as _clone, endsWith as _endsWith, remove as _remove, sortBy as _sortBy } from 'lodash';
import { map, take } from 'rxjs/operators';
import { filterSchemas } from '../../utils/components.utils';


@Component({
  selector: 'sudokulab-print-page',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintComponent extends DestroyComponent implements AfterViewInit {
  private _schemas$: BehaviorSubject<PlaySudoku[]>;
  loading$: BehaviorSubject<boolean>;
  schemas$: Observable<PlaySudoku[]>;
  pages$: Observable<PrintPage[]>;
  activeArea$: Observable<string>;

  constructor(_sudoku: SudokuFacade,
              private _print: PrintFacade,
              private _lab: LabFacade,
              private _window: SudokulabWindowService) {
    super(_sudoku);
    this._schemas$ = new BehaviorSubject<PlaySudoku[]>([]);
    this.schemas$ = combineLatest(this._schemas$, _lab.selectSchemasOptions$)
      .pipe(map(([ss, o]) => filterSchemas(ss, o)));
    this.loading$ = new BehaviorSubject<boolean>(true);
    this.pages$ = _print.selectPrintPages$;
    this.activeArea$ = _print.selectActivePageArea$;
  }

  private _onPages(handler: (pages: PrintPage[], page?: PrintPage) => boolean, id?: string) {
    use(this.pages$, pages => {
      const cpages = _clone(pages);
      const cpage = id ? cpages.find(p => p.id === id) : undefined;
      if (handler(cpages, cpage)) this._print.setPrintPages(cpages);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this._sudoku.selectAllSchemas$
        .pipe(take(1))
        .subscribe(schemas => {
          this._schemas$.next(schemas||[]);
          setTimeout(() => this.loading$.next(false), 250);
        })
    }, 1000);
  }

  activeArea(aid: string) {
    this._print.setPrintArea(aid);
  }

  addSchema(sdk: PlaySudoku) {
    use(this.activeArea$, target => {
      if (!target) return;
      this._onPages((pages, page) => {
        const pos = _endsWith(target, 'top') ? 'top' : 'bottom';
        if (page) page.schema[pos] = sdk.sudoku;
        return true;
      }, target.substr(0, target.indexOf('_')));
    });
  }

  addPage() {
    this._onPages((pages) => {
      const np = new PrintPage();
      this._print.setPrintArea(`${np.id}_top`);
      return !!pages.push(np);
    });
  }

  removePage(id: string) {
    this._onPages((pages) => !!_remove(pages, p => p.id === id));
  }

  clearPage(id: string) {
    this._onPages((pages, page) => {
      if (page) page.schema = {};
      return true;
    }, id);
  }
}
