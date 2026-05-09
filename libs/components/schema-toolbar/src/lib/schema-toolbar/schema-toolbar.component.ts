import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, of, takeUntil } from 'rxjs';
import { BUTTON_STOP_CODE, ToolbarButton, ToolbarStatus } from './schema-toolbar.model';
import { ManagerComponentBase, SudokuState } from '@olmi/common';
import { extendStatus, getButtons, isValueLocked, setValueButtonStatus } from './schema-toolbar.helper';
import { FlexModule } from '@angular/flex-layout';
import { BoardChangeEvent, BoardEventStatus, BoardManager } from '@olmi/board';
import { MatProgressBar } from '@angular/material/progress-bar';

const LONG_PRESS_MS = 1000;
const SYNTH_MOUSE_GUARD_MS = 500;
const TB_VALUE_EMPTY = 'tb-value-empty';
const TB_VALUE_DYNAMIC = 'tb-value-dynamic';
const TB_VALUE_PREFIX = /^tb-value-/;

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
export class SchemaToolbarComponent extends ManagerComponentBase<BoardManager> implements OnInit, OnDestroy {
  buttons$: BehaviorSubject<ToolbarButton[]>;
  status$: BehaviorSubject<ToolbarStatus>;
  percent$: Observable<number> = of(0);
  disabled$: BehaviorSubject<boolean>;

  private _pressTimer: ReturnType<typeof setTimeout> | null = null;
  private _longPressFired = false;
  private _activePressCode: string | null = null;
  private _lastTouchEnd = 0;

  @Input()
  set template(t: string) {
    this.buttons$.next(getButtons(t));
  }

  @Input()
  showProgress = false;

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
      const code = btn.code || '';
      // restore global status
      status.disabled[code] = false;
      if (TB_VALUE_PREFIX.test(code)) {
        setValueButtonStatus(status, code, this.manager);
        const locked = isValueLocked(this.manager, btn.value ?? '');
        if (locked) {
          status.active[code] = true;
          status.disabled[code] = false;
        } else if (code === TB_VALUE_EMPTY || code === TB_VALUE_DYNAMIC) {
          // empty/dynamic non sono toccati da setValueButtonStatus su `active`,
          // serve resettare per evitare che il merge in extendStatus erediti il vecchio true
          status.active[code] = false;
        }
      } else {
        switch (code) {
          case 'tb-pencil':
            status.active[code] = !!this.manager?.status$.value.isPencil;
            break;
          case 'tb-play':
            status.hidden[code] = SudokuState.isRunning$.value;
            break;
          case BUTTON_STOP_CODE:
            status.hidden[code] = !SudokuState.isRunning$.value;
            status.disabled[code] = !!this.manager?.isStopping$.value;
            break;
        }
      }
      // global disabled
      if (this.disabled$.value && code !== BUTTON_STOP_CODE) status.disabled[code] = true;
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
        this.manager.lockedValue$,
        SudokuState.isRunning$,
        this.disabled$])
        .pipe(takeUntil(this._destroy$))
        .subscribe(() => extendStatus(this.status$, this._calcButtonsStatus()));

      // pencil mode è incompatibile con l'hold-state: sblocca alla transizione
      this.manager.status$
        .pipe(
          takeUntil(this._destroy$),
          map(s => s.isPencil),
          distinctUntilChanged())
        .subscribe(isPencil => {
          if (isPencil && this.manager!.status$.value.isLock) {
            this.manager!.options({ isLock: false });
          }
        });

      this.percent$ = this.manager.stat$.pipe(map(stat => stat.percent));
    }
  }

  override ngOnDestroy() {
    this._clearPressTimer();
    super.ngOnDestroy();
  }

  clickOnButton(btn: ToolbarButton) {
    const code = btn.code || '';
    if (this._longPressFired && code === this._activePressCode) {
      this._longPressFired = false;
      this._activePressCode = null;
      return;
    }
    if ((this.status$.value.disabled || {})[code]) return;
    this.manager?.execOperation(btn.operation || 'assign', btn.value, true);
  }

  onPressStart(btn: ToolbarButton, event?: Event) {
    // ignora il mousedown sintetico emesso dopo un touchend (ghost click)
    if (event?.type === 'mousedown' && Date.now() - this._lastTouchEnd < SYNTH_MOUSE_GUARD_MS) return;
    const code = btn.code || '';
    if (!TB_VALUE_PREFIX.test(code)) return;
    // in pencil mode il long-press resta abilitato solo per il bottone empty
    const isPencil = !!this.manager?.status$.value.isPencil;
    if (isPencil && code !== TB_VALUE_EMPTY) return;
    if (this._pressTimer) return;
    this._longPressFired = false;
    this._activePressCode = code;
    this._pressTimer = setTimeout(() => {
      this._pressTimer = null;
      this._longPressFired = true;
      this._toggleValueLock(btn.value ?? '');
    }, LONG_PRESS_MS);
  }

  onPressEnd(event?: Event) {
    if (event?.type === 'touchend' || event?.type === 'touchcancel') {
      this._lastTouchEnd = Date.now();
      // sopprime il click sintetico che il browser emette dopo touchend quando il long-press è scattato
      if (this._longPressFired) event.preventDefault();
    }
    this._clearPressTimer();
  }

  private _clearPressTimer() {
    if (this._pressTimer) {
      clearTimeout(this._pressTimer);
      this._pressTimer = null;
    }
  }

  private _toggleValueLock(value: string) {
    if (!this.manager) return;
    if (isValueLocked(this.manager, value)) {
      this.manager.options({ isLock: false });
      return;
    }
    this.manager.options({ isLock: true });
    this.manager.lockedValue$.next(new BoardChangeEvent({
      value,
      cell: this.manager.selection$.value,
      status: new BoardEventStatus({ ...this.manager.status$.value })
    }));
  }
}


