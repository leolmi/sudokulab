import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DestroyComponent } from '../../components/DestroyComponent';
import { PrintTemplate, Sudoku, SudokuFacade, SudokulabWindowService } from '@sudokulab/model';
import { templates } from './templates';
import { BehaviorSubject, Observable } from 'rxjs';
import { values as _values } from 'lodash';
import { tap } from 'rxjs/operators';


@Component({
  selector: 'sudokulab-print-page',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintComponent extends DestroyComponent {
  templates$: BehaviorSubject<PrintTemplate[]>;
  activeTemplate$: Observable<string>;
  constructor(_sudoku: SudokuFacade,
              private _window: SudokulabWindowService) {
    super(_sudoku);
    this.templates$ = new BehaviorSubject<PrintTemplate[]>(_values(templates));
    this.activeTemplate$ = _sudoku.selectActiveTemplate$.pipe(tap(a => console.log('ACTIVE=', a)));
  }


  print(schemas: Sudoku[], step = 1) {
    const LN = (schemas||[]).length;


  }

  useThisTemplate(tmp: PrintTemplate) {
    this._sudoku.setPrintTemplate(tmp.code);
  }
}
