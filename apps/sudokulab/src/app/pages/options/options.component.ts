import {ChangeDetectionStrategy, Component, OnDestroy} from "@angular/core";
import { BehaviorSubject, Observable } from 'rxjs';
import { isDebugMode, setDebugMode, SudokuFacade, SUDOKULAB_DARK_THEME, SUDOKULAB_LIGHT_THEME } from '@sudokulab/model';
import { map } from 'rxjs/operators';

@Component({
  selector: 'sudokulab-options-page',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionsComponent  {
  isDebugMode$: BehaviorSubject<boolean>;
  isDarkTheme$: Observable<boolean>;
  showAvailable$: BehaviorSubject<boolean>;

  constructor(private _sudoku: SudokuFacade) {
    this.isDebugMode$ = new BehaviorSubject<boolean>(isDebugMode());
    this.showAvailable$ = new BehaviorSubject<boolean>(false);
    this.isDarkTheme$ = _sudoku.selectTheme$.pipe(map(theme => theme === SUDOKULAB_DARK_THEME));
  }

  setDebugMode(e: any) {
    setDebugMode(e.checked);
  }
  setDarkTheme(e: any) {
    this._sudoku.setTheme(e.checked ? SUDOKULAB_DARK_THEME : SUDOKULAB_LIGHT_THEME);
  }

  apply(e: any, target: string) {

  }
}
