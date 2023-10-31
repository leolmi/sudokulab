import {ChangeDetectionStrategy, Component} from '@angular/core';
import {DestroyComponent} from '../../components/DestroyComponent';
import {PrintPage, Sudoku, SudokuLab, use} from '@sudokulab/model';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {cloneDeep as _clone, endsWith as _endsWith, remove as _remove} from 'lodash';
import {map} from 'rxjs/operators';
import {filterSchemas} from '../../utils/components.utils';


@Component({
  selector: 'sudokulab-print-page',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintComponent extends DestroyComponent {
  loading$: BehaviorSubject<boolean>;
  schemas$: Observable<Sudoku[]>;

  constructor(public sudokuLab: SudokuLab) {
    super(sudokuLab);
    this.schemas$ = combineLatest([sudokuLab.state.schemas$, sudokuLab.state.schemasOptions$])
      .pipe(map(([ss, o]) => {
        if (ss?.length>0) this.loading$.next(false);
        return filterSchemas(ss, o);
      }));
    this.loading$ = new BehaviorSubject<boolean>(true);
  }

  private _onPages(handler: (pages: PrintPage[], page?: PrintPage) => boolean, id?: string) {
    use(this.sudokuLab.state.printPages$, pages => {
      const cpages = _clone(pages);
      const cpage = id ? cpages.find(p => p.id === id) : undefined;
      if (handler(cpages, cpage)) this.sudokuLab.state.printPages$.next(cpages);
    });
  }

  activeArea(aid: string) {
    this.sudokuLab.state.activePrintArea$.next(aid);
  }

  addSchema(sdk: Sudoku) {
    use(this.sudokuLab.state.activePrintArea$, target => {
      if (!target) return;
      this._onPages((pages, page) => {
        const pos = _endsWith(target, 'top') ? 'top' : 'bottom';
        if (page) page.schema[pos] = sdk;
        return true;
      }, target.substr(0, target.indexOf('_')));
    });
  }

  addPage() {
    this._onPages((pages) => {
      const np = new PrintPage();
      this.sudokuLab.state.activePrintArea$.next(`${np.id}_top`);
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
