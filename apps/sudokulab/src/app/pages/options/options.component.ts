import {ChangeDetectionStrategy, Component} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {
  clearUserSettings,
  isDebugMode,
  MessageType,
  PlaySudokuOptions,
  setDebugMode,
  SudokuLab,
  SUDOKULAB_DARK_THEME,
  SUDOKULAB_LIGHT_THEME,
  SUDOKULAB_MANAGE_OPERATION,
  SUDOKULAB_SESSION_DEVELOP,
  SudokuMessage
} from '@sudokulab/model';
import {filter, map} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {ManagementKeyDialogComponent} from "../../components/management-key-dialog/management-key-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'sudokulab-options-page',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionsComponent {
  isDebugMode$: BehaviorSubject<boolean>;
  isDarkTheme$: Observable<boolean>;
  playerOptions$: Observable<PlaySudokuOptions|undefined>;
  isManagement$: Observable<boolean>;
  isOperationActive$: Observable<boolean>;
  OPERATION = SUDOKULAB_MANAGE_OPERATION;
  availableValuesModes: string[] = ['number', 'dot'];

  constructor(public sudokuLab: SudokuLab,
              private _dialog: MatDialog) {
    this.isDebugMode$ = new BehaviorSubject<boolean>(isDebugMode());
    this.isDarkTheme$ = sudokuLab.state.theme$.pipe(map(theme => theme === SUDOKULAB_DARK_THEME));
    this.isManagement$ = combineLatest([sudokuLab.state.token$, sudokuLab.state.info$]).pipe(
      map(([t, info]) => !!t || info?.session === SUDOKULAB_SESSION_DEVELOP || !environment.production));

    this.isOperationActive$ = sudokuLab.state.operationStatus$.pipe(map(o => (o||-1)>=0));
    this.playerOptions$ = sudokuLab.state.activePlaySudoku$.pipe(map(sdk => new PlaySudokuOptions(sdk?.options)));
  }

  setDebugMode(e: any) {
    setDebugMode(e.checked);
  }
  setDarkTheme(e: any) {
    this.sudokuLab.state.theme$.next(e.checked ? SUDOKULAB_DARK_THEME : SUDOKULAB_LIGHT_THEME);
  }
  setValuesMode(e: string) {
    this.sudokuLab.state.valuesMode$.next(e);
  }

  apply(v: any, target: string) {
    this.sudokuLab.updatePlayerOptions({ [target]: v });
  }

  applyValue(v: any, target: string) {
    this.sudokuLab.updatePlayerOptions({ [target]: getValue(v?.target) });
  }

  manage(operation: string, data?: any) {
    this._dialog.open(ManagementKeyDialogComponent, { width: '400px', data })
      .afterClosed()
      .pipe(filter(key => !!key))
      .subscribe(key => this.sudokuLab.manage(operation, key, data));
  }

  clearUSettings() {
    clearUserSettings();
    setTimeout(() => this.sudokuLab.showMessage(new SudokuMessage({
      message: 'User settings has been deleted! Page will reload...',
      type: MessageType.success
    })));
    setTimeout(() => location.reload(), 2000);
  }
}


const getValue = (e: HTMLInputElement): any => {
  switch(e.type) {
    case 'number': return e.valueAsNumber;
    case 'date': return e.valueAsDate;
    default: return e.value;
  }
}
