import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, combineLatest, map, Observable, of, takeUntil } from 'rxjs';
import { BUTTON_STOP_CODE, ToolbarButton, ToolbarStatus } from './schema-toolbar.model';
import { ManagerComponentBase, SudokuState } from '@olmi/common';
import { extendStatus, getButtons, setValueButtonStatus } from './schema-toolbar.helper';
import { FlexModule } from '@angular/flex-layout';
import { BoardCell } from '@olmi/board';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'schema-toolbar',
  imports: [
    CommonModule,
    FlexModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBar
  ],
  templateUrl: './schema-toolbar.component.html',
  styleUrl: './schema-toolbar.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SchemaToolbarComponent extends ManagerComponentBase implements OnInit {
  buttons$: BehaviorSubject<ToolbarButton[]>;
  status$: BehaviorSubject<ToolbarStatus>;
  percent$: Observable<number> = of(0);
  disabled$: BehaviorSubject<boolean>;
  isLocked$: Observable<boolean> = of(false);

  @Input()
  set template(t: string) {
    this.buttons$.next(getButtons(t));
  }

  @Input()
  showProgress: boolean = false;

  @Input()
  set disabled(d: boolean|null|undefined) {
    this.disabled$.next(!!d);
  }

  constructor() {
    super();

    this.disabled$ = new BehaviorSubject<boolean>(false);
    this.buttons$ = new BehaviorSubject<ToolbarButton[]>([]);
    this.status$ = new BehaviorSubject<any>(new ToolbarStatus());
  }

  private _calcButtonsStatus(): Partial<ToolbarStatus> {
    const status = new ToolbarStatus();
    (this.buttons$.value || []).forEach(btn => {
      // restore global status
      status.disabled[btn.code || ''] = false;
      if (/^tb-value-/g.test(btn.code || '')) {
        setValueButtonStatus(status, btn.code, this.manager);
      } else {
        switch (btn.code) {
          case 'tb-pencil':
            status.active[btn.code || ''] = !!this.manager?.status$.value.isPencil;
            break;
          case 'tb-play':
            status.hidden[btn.code || ''] = SudokuState.isRunning$.value;
            break;
          case BUTTON_STOP_CODE:
            status.hidden[btn.code || ''] = !SudokuState.isRunning$.value;
            status.disabled[btn.code || ''] = !!this.manager?.isStopping$.value;
            break;
        }
      }
      // global disabled
      if (this.disabled$.value && btn.code !== BUTTON_STOP_CODE) status.disabled[btn.code || ''] = true;
    });
    return status;
  }

  ngOnInit() {
    if (this.manager) {
      // rileva tutte le mutazioni utili allo stato dei buttons
      combineLatest([
        this.manager.selection$,
        this.manager.focused$,
        this.manager.stat$,
        this.manager.status$,
        this.manager.isStopping$,
        SudokuState.isRunning$,
        this.disabled$])
        .pipe(takeUntil(this._destroy$))
        .subscribe(() => extendStatus(this.status$, this._calcButtonsStatus()));

      this.percent$ = this.manager.stat$.pipe(map(stat => stat.percent));
      this.isLocked$ = this.manager.status$.pipe(map(status => status.isLock));
    }
  }

  clickOnButton(btn: ToolbarButton) {
    this.manager?.execOperation(btn.operation||'assign', btn.value, true);
  }
}


