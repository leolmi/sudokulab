import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { BUTTON_STOP_CODE, ToolbarButton, ToolbarStatus } from './schema-toolbar.model';
import { SudokuState } from '@olmi/common';
import { extendStatus, getButtons, isValueLocked, setValueButtonStatus } from './schema-toolbar.helper';
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
    MatButtonModule,
    MatIconModule,
    MatProgressBar,
  ],
  templateUrl: './schema-toolbar.component.html',
  styleUrl: './schema-toolbar.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaToolbarComponent implements OnDestroy {
  private readonly _destroyRef = inject(DestroyRef);

  readonly manager = input<BoardManager | null | undefined>(null);
  readonly template = input<string>('');
  readonly showProgress = input<boolean>(false);
  readonly disabled = input<boolean | null | undefined>(false);

  readonly buttons = computed<ToolbarButton[]>(() => getButtons(this.template()));
  readonly status = signal<ToolbarStatus>(new ToolbarStatus());
  readonly percent = signal<number>(0);

  private _pressTimer: ReturnType<typeof setTimeout> | null = null;
  private _longPressFired = false;
  private _activePressCode: string | null = null;
  private _lastTouchEnd = 0;

  constructor() {
    // ricalcolo dello stato dei buttons al cambiare di tutte le sorgenti
    // rilevanti: i Subject del BoardManager (ancora basato su BehaviorSubject
    // in attesa della Fase 4) sono ascoltati via combineLatest, ricreata ad
    // ogni cambio di `manager`/`buttons`/`disabled` tramite il cleanup
    // dell'effect.
    effect(onCleanup => {
      const m = this.manager();
      this.buttons();
      this.disabled();
      // dipendenza esplicita su `isRunning` (signal): ricrea le subscription
      // quando `isRunning` cambia, niente più `SudokuState.isRunning$` nel combineLatest
      SudokuState.isRunning();
      if (!m) return;
      extendStatus(this.status, this._calcButtonsStatus());
      const sub = combineLatest([
        m.selection$,
        m.focused$,
        m.stat$,
        m.status$,
        m.isStopping$,
        m.lockedValue$,
      ])
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(() => extendStatus(this.status, this._calcButtonsStatus()));
      onCleanup(() => sub.unsubscribe());
    });

    // pencil mode è incompatibile con l'hold-state: sblocca alla transizione
    effect(onCleanup => {
      const m = this.manager();
      if (!m) return;
      const sub = m.status$.pipe(
        map(s => s.isPencil),
        distinctUntilChanged(),
      )
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(isPencil => {
          if (isPencil && m.status$.value.isLock) m.options({ isLock: false });
        });
      onCleanup(() => sub.unsubscribe());
    });

    // percent della progress bar
    effect(onCleanup => {
      const m = this.manager();
      if (!m) {
        this.percent.set(0);
        return;
      }
      const sub = m.stat$
        .pipe(map(stat => stat.percent), takeUntilDestroyed(this._destroyRef))
        .subscribe(p => this.percent.set(p));
      onCleanup(() => sub.unsubscribe());
    });
  }

  ngOnDestroy() {
    this._clearPressTimer();
  }

  private _calcButtonsStatus(): Partial<ToolbarStatus> {
    const status = new ToolbarStatus();
    const manager = this.manager() ?? undefined;
    const isDisabled = !!this.disabled();
    (this.buttons() || []).forEach(btn => {
      const code = btn.code || '';
      // restore global status
      status.disabled[code] = false;
      if (TB_VALUE_PREFIX.test(code)) {
        setValueButtonStatus(status, code, manager);
        const locked = isValueLocked(manager, btn.value ?? '');
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
            status.active[code] = !!manager?.status$.value.isPencil;
            break;
          case 'tb-play':
            status.hidden[code] = SudokuState.isRunning();
            break;
          case BUTTON_STOP_CODE:
            status.hidden[code] = !SudokuState.isRunning();
            status.disabled[code] = !!manager?.isStopping$.value;
            break;
        }
      }
      // global disabled
      if (isDisabled && code !== BUTTON_STOP_CODE) status.disabled[code] = true;
    });
    // empty e dynamic condividono uno slot: il lock su uno dei due deve avere
    // priorità sullo swap automatico calcolato da setValueButtonStatus
    if (isValueLocked(manager, '?')) {
      status.hidden[TB_VALUE_DYNAMIC] = false;
      status.hidden[TB_VALUE_EMPTY] = true;
    } else if (isValueLocked(manager, '')) {
      status.hidden[TB_VALUE_EMPTY] = false;
      status.hidden[TB_VALUE_DYNAMIC] = true;
    }
    return status;
  }

  clickOnButton(btn: ToolbarButton) {
    const code = btn.code || '';
    if (this._longPressFired && code === this._activePressCode) {
      this._longPressFired = false;
      this._activePressCode = null;
      return;
    }
    if ((this.status().disabled || {})[code]) return;
    this.manager()?.execOperation(btn.operation || 'assign', btn.value, true);
  }

  onPressStart(btn: ToolbarButton, event?: Event) {
    // ignora il mousedown sintetico emesso dopo un touchend (ghost click)
    if (event?.type === 'mousedown' && Date.now() - this._lastTouchEnd < SYNTH_MOUSE_GUARD_MS) return;
    const code = btn.code || '';
    if (!TB_VALUE_PREFIX.test(code)) return;
    // in pencil mode il long-press resta abilitato solo per il bottone empty
    const isPencil = !!this.manager()?.status$.value.isPencil;
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
    const manager = this.manager();
    if (!manager) return;
    if (isValueLocked(manager, value)) {
      manager.options({ isLock: false });
      return;
    }
    manager.options({ isLock: true });
    manager.lockedValue$.next(new BoardChangeEvent({
      value,
      cell: manager.selection$.value,
      status: new BoardEventStatus({ ...manager.status$.value })
    }));
  }
}
