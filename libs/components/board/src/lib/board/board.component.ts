import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BoardCell,
  BoardChangeEvent,
  BoardEventStatus,
  BoardGroup,
  BoardNextMode,
  BoardStatus,
  GEOMETRY,
  NEXT_DIRECTION
} from './board.model';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { cloneDeep as _clone, isNumber as _isNumber, isString as _isString } from 'lodash';
import {
  Coding,
  isCopyKeys,
  isDeleteKey,
  isDirectionKey,
  isNextStepKey,
  isSkippedKey,
  moveOnDirection,
  parseCells
} from './board.helper';
import { BOARD_PREFIX, getBoardClasses } from './board.internal';
import { BoardManager } from './board.manager';
import {
  Cell,
  DEFAULT_RANK,
  getCell,
  getCellsSchema,
  Highlights,
  isSchemaString,
  LogicExecutor,
  NotificationType,
  SudokuCell,
  update
} from '@olmi/model';
import { SUDOKU_NOTIFIER } from '@olmi/common';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { CellRadialPickerComponent } from './cell-radial-picker.component';

const PICKER_LONG_PRESS_MS = 350;
const PICKER_MOVE_TOLERANCE_PX = 8;
const PICKER_DEAD_ZONE_RATIO = 0.13; // = innerRadius / outerRadius del picker
const PICKER_RADIUS_MIN_PX = 60;
const PICKER_RADIUS_MAX_PX = 105;
const PICKER_RADIUS_CELL_RATIO = 1.4;

interface PickerState {
  cell: BoardCell;
  pointerId: number;
  capturedEl: Element;
  startX: number;
  startY: number;
  centerX: number;
  centerY: number;
  radius: number;
  values: string[];
  hoveredIndex: number;
  open: boolean;
  longPressFired: boolean;
}

@Component({
  selector: 'sudoku-board',
  imports: [
    CommonModule,
    ClipboardModule,
    CellRadialPickerComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, AfterViewInit, OnDestroy {
  // counter per generare id univoci dei clipPath (più board convivono in stampa,
  // catalogo, ecc.); gli id nei <defs> SVG sono globali al documento.
  private static _idSeq = 0;

  @HostBinding('attr.focusable') focusable = '';
  @HostBinding('attr.tabIndex') tabIndex = 0;
  @ViewChild('board') board: ElementRef|undefined = undefined;

  /** id del clipPath usato per arrotondare il contorno dello schema. */
  readonly boardClipId = `sdk-board-clip-${++BoardComponent._idSeq}`;

  private _notifier = inject(SUDOKU_NOTIFIER);
  private _clipboard = inject(Clipboard);
  private _element: ElementRef;

  GEOMETRY = GEOMETRY;
  manager: BoardManager|undefined;
  height$: BehaviorSubject<number>;
  cells$: BehaviorSubject<BoardCell[]>;
  status$: BehaviorSubject<BoardStatus>;
  highlights$: BehaviorSubject<Highlights>;

  isFocused$: Observable<boolean> = of(false);
  currentCellId$: Observable<string> = of('');
  currentCellCol$: Observable<number> = of(-1);
  currentCellRow$: Observable<number> = of(-1);
  class$: Observable<any>;
  hlgroups$: Observable<BoardGroup[]>;

  // stato del radial-picker (overlay HTML sopra la board)
  pickerOpen$: BehaviorSubject<boolean>;
  pickerValues$: BehaviorSubject<string[]>;
  pickerHoveredIndex$: BehaviorSubject<number>;
  pickerCenter$: BehaviorSubject<{x: number, y: number}>;
  pickerRadius$: BehaviorSubject<number>;
  // pre-commit preview: id cella + valore previsto durante il drag nel picker
  previewCellId$: BehaviorSubject<string>;
  previewValue$: BehaviorSubject<string>;

  private _pickerState: PickerState | null = null;
  private _pickerTimer: ReturnType<typeof setTimeout> | null = null;
  private _hostTouchStart: ((e: TouchEvent) => void) | null = null;

  // === DEBUG REPORT (radial-picker) ==========================================
  // Strumentazione attivabile: raccoglie tutti gli eventi rilevanti durante la
  // vita del picker (pointer, capture, touch, contextmenu, scroll, ecc.) e
  // alla chiusura copia un report testuale in clipboard.
  private static readonly PICKER_DEBUG = true;
  private _pickerLog: string[] = [];
  private _pickerLogT0 = 0;
  private _pickerLogActive = false;
  private _pickerWinHandlers: Array<{target: any; type: string; fn: any; opts?: any}> = [];

  /**
   * celle dello schema
   * @param cs
   */
  @Input() set cells(cs: SudokuCell[]|undefined|null) {
    this.cells$.next(parseCells(cs))
  }

  /**
   * stato dello schema
   * @param s
   */
  @Input() set status(s: Partial<BoardStatus>|undefined|null) {
    update(this.status$, s||{});
  }
  get status(): BoardStatus {
    return this.status$.value;
  }

  /**
   * evidenze nello schema
   * @param h
   */
  @Input() set highlights(h: Highlights|string|undefined|null) {
    const hl = _isString(h) ?
      Coding.decodeHighlightsString(h) :
      <Highlights>h || new Highlights();
    // console.log(...BOARD_PREFIX, 'highlights on board', hl);
    this.highlights$.next(hl);
  }

  /**
   * cella selezionata
   * @param p
   */
  @Input() set selection(p: Cell|undefined|null) {
    this.manager?.selection$.next(<BoardCell>getCell(this.cells$.value, p));
  }

  @Input()
  logic: LogicExecutor|undefined;

  @Output()
  selectionChanged: EventEmitter<BoardCell|undefined> = new EventEmitter<BoardCell|undefined>();

  @Output()
  boardChangeRequest: EventEmitter<BoardChangeEvent> = new EventEmitter<BoardChangeEvent>();

  @Output()
  pasteSchemaRequest: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  onReady: EventEmitter<BoardManager> = new EventEmitter<BoardManager>();

  constructor() {
    this._element = inject(ElementRef);
    this.height$ = new BehaviorSubject<number>(10);
    this.cells$ = new BehaviorSubject<BoardCell[]>(parseCells());
    this.status$ = new BehaviorSubject<BoardStatus>(new BoardStatus());
    this.highlights$ = new BehaviorSubject<Highlights>(new Highlights())

    this.pickerOpen$ = new BehaviorSubject<boolean>(false);
    this.pickerValues$ = new BehaviorSubject<string[]>([]);
    this.pickerHoveredIndex$ = new BehaviorSubject<number>(-1);
    this.pickerCenter$ = new BehaviorSubject<{x: number, y: number}>({x: 0, y: 0});
    this.pickerRadius$ = new BehaviorSubject<number>(PICKER_RADIUS_MAX_PX);
    this.previewCellId$ = new BehaviorSubject<string>('');
    this.previewValue$ = new BehaviorSubject<string>('');

    this.class$ = this.status$.pipe(map((s) => getBoardClasses(s)));

    this.hlgroups$ = this.highlights$.pipe(map(hl =>
      (hl?.groups||[]).map(g => new BoardGroup(g))));

    this._calcComponentHeight();
  }

  private _calcComponentHeight() {
    const rect = this.board?.nativeElement.getBoundingClientRect();
    if (rect?.width > 0 && rect!.width !== this.height$.value) this.height$.next(rect!.width);
  }

  private _getBoardCell(cid: BoardCell|string|undefined|null): BoardCell|undefined {
    return <BoardCell|undefined>getCell(<SudokuCell[]>this.cells$.value||[], cid);
  }

  private _updateSelection(cell: BoardCell|undefined) {
    if (this.manager) {
      this.manager.selection$.next(cell);
      this.selectionChanged.next(this.manager.selection$.value);
    }
  }

  ngOnInit() {
    this.manager = new BoardManager(this, this._notifier);

    this.currentCellId$ = this.manager.selection$.pipe(map(s => s?.id||''));
    this.currentCellCol$ = this.manager.selection$.pipe(map(s => getColRow(s?.col)));
    this.currentCellRow$ = this.manager.selection$.pipe(map(s => getColRow(s?.row)));
    this.isFocused$ = this.manager.focused$.pipe(map(f => f));
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this._calcComponentHeight();
      this.onReady.emit(this.manager);
    });
    // listener touchstart non-passive sull'host: necessario per chiamare
    // preventDefault e inibire il long-press di sistema su Android Chrome,
    // che altrimenti emette pointercancel al primo movimento dopo il long-press.
    // Angular HostListener non permette {passive:false}, quindi va registrato
    // manualmente.
    const host: HTMLElement = this._element.nativeElement;
    this._hostTouchStart = (e: TouchEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      // intercetta solo touchstart che originano sulle celle interattive
      if (!(t instanceof Element) || !t.classList?.contains('svg-board-cell')) return;
      // un solo dito (multitouch lasciato libero per pinch/zoom)
      if (e.touches.length !== 1) return;
      try { e.preventDefault(); } catch { /* noop */ }
    };
    host.addEventListener('touchstart', this._hostTouchStart, { passive: false });
  }

  ngOnDestroy() {
    if (this._hostTouchStart) {
      try { this._element.nativeElement.removeEventListener('touchstart', this._hostTouchStart); } catch { /* noop */ }
      this._hostTouchStart = null;
    }
    this.manager?.dispose();
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (document.activeElement !== this._element?.nativeElement || this.status.isDisabled) return;
    event.stopPropagation();
    event.preventDefault();
    this._handleKeyboardEvents(event);
  }

  @HostListener('window:paste', ['$event'])
  pastEvent(event: ClipboardEvent) {
    if (!this.status.isPasteEnabled || !this.manager?.focused$.value) return;
    const values = event.clipboardData?.getData('text')||'';
    if (isSchemaString(values)) this.pasteSchemaRequest.emit(values);
  }

  @HostListener('window:resize')
  resize() {
    setTimeout(() => this._calcComponentHeight());
  }

  @HostListener('focus')
  @HostListener('focusin')
  @HostListener('focused')
  componentFocusIn() {
    this.manager?.focused$.next(true);
  }
  @HostListener('focusout')
  componentFocusOut() {
    this.manager?.focused$.next(false);
  }

  focus() {
    this._element.nativeElement.focus();
  }

  select(cid: BoardCell|string|undefined|null) {
    if (this.status.isDisabled) return;
    const cell = this._getBoardCell(cid);
    if (this.status.isDebug) console.log(...BOARD_PREFIX, 'CLICKED CELL', cell);
    this._element?.nativeElement.focus();
    this._updateSelection(cell);
    this.manager?.checkLockedValue(cell);
  }

  onCellPointerDown(cell: BoardCell, event: PointerEvent) {
    if (this.status.isDisabled) return;
    // accetta solo il primary button: ignora right-click / middle-click
    if (event.button !== 0) return;
    // long-press disabilitato sulle celle fisse in play (non si possono modificare)
    if (this.status.editMode === 'play' && cell.isFixed) return;
    const target = event.target as Element;
    if (!target || typeof (target as any).setPointerCapture !== 'function') return;
    // su Android Chrome questo inibisce il long-press di sistema (selezione/drag)
    // che altrimenti cancella il pointer al primo movimento dopo il long-press.
    if (event.pointerType === 'touch') {
      try { event.preventDefault(); } catch { /* noop */ }
    }
    this._pickerLogStart(cell, event, target);
    let captureOk = false;
    try {
      target.setPointerCapture(event.pointerId);
      captureOk = (target as any).hasPointerCapture?.(event.pointerId) ?? true;
    } catch (err: any) {
      this._logPicker('setPointerCapture-throw', { msg: String(err?.message||err) });
    }
    this._logPicker('setPointerCapture', { ok: captureOk });
    const cellRect = (target as Element).getBoundingClientRect();
    // raggio del picker proporzionato alla dimensione della cella
    const radius = Math.max(
      PICKER_RADIUS_MIN_PX,
      Math.min(PICKER_RADIUS_MAX_PX, cellRect.width * PICKER_RADIUS_CELL_RATIO)
    );
    // centro del picker in coordinate viewport (è position: fixed → niente scrollbar anche se sfora)
    this._pickerState = {
      cell,
      pointerId: event.pointerId,
      capturedEl: target,
      startX: event.clientX,
      startY: event.clientY,
      centerX: cellRect.left + cellRect.width / 2,
      centerY: cellRect.top + cellRect.height / 2,
      radius,
      values: this._getPickerValues(),
      hoveredIndex: -1,
      open: false,
      longPressFired: false,
    };
    this._logPicker('state-init', {
      cell: cell.id,
      cellRect: this._roundRect(cellRect),
      center: { x: Math.round(this._pickerState.centerX), y: Math.round(this._pickerState.centerY) },
      radius: Math.round(radius),
      values: this._pickerState.values,
    });
    this._clearPickerTimer();
    this._pickerTimer = setTimeout(() => {
      this._pickerTimer = null;
      if (!this._pickerState) return;
      this._pickerState.longPressFired = true;
      this._logPicker('long-press-fire');
      this._openPicker(cell);
    }, PICKER_LONG_PRESS_MS);
  }

  onPointerMove(event: PointerEvent) {
    const st = this._pickerState;
    if (!st || event.pointerId !== st.pointerId) return;
    this._logPicker('rect:pointermove', this._evInfoPointer(event, st));
    if (!st.open) {
      // se il pointer si sposta troppo prima dello scatto, annulla il long-press
      const dx = event.clientX - st.startX;
      const dy = event.clientY - st.startY;
      if (Math.hypot(dx, dy) > PICKER_MOVE_TOLERANCE_PX) {
        this._logPicker('long-press-abort-by-move', { dx: Math.round(dx), dy: Math.round(dy) });
        this._clearPickerTimer();
      }
      return;
    }
    // pointer e centro picker sono entrambi in coordinate viewport (position: fixed)
    this._updatePickerHovered(event.clientX, event.clientY);
  }

  onPointerUp(event: PointerEvent) {
    const st = this._pickerState;
    if (!st || event.pointerId !== st.pointerId) return;
    this._logPicker('rect:pointerup', this._evInfoPointer(event, st));
    this._clearPickerTimer();
    if (st.open) {
      if (st.hoveredIndex >= 0 && st.hoveredIndex < st.values.length) {
        this._commitPickerValue(st.cell, st.values[st.hoveredIndex]);
      } else {
        this._logPicker('commit-skip', { hoveredIndex: st.hoveredIndex });
      }
      this._closePicker('pointerup');
    } else if (!st.longPressFired) {
      // tap breve: equivalente al click, seleziona la cella
      this._logPicker('short-tap-select');
      this.select(st.cell);
    }
    this._releasePickerCapture();
    this._pickerLogEnd('pointerup');
    this._pickerState = null;
  }

  onPointerCancel(event: PointerEvent) {
    const st = this._pickerState;
    if (!st || event.pointerId !== st.pointerId) return;
    this._logPicker('rect:pointercancel', this._evInfoPointer(event, st));
    this._clearPickerTimer();
    if (st.open) this._closePicker('pointercancel');
    this._releasePickerCapture();
    this._pickerLogEnd('pointercancel');
    this._pickerState = null;
  }

  private _releasePickerCapture() {
    const st = this._pickerState;
    if (!st) return;
    try {
      const has = (st.capturedEl as any).hasPointerCapture?.(st.pointerId);
      this._logPicker('release-capture', { hadCapture: has });
      if (has) {
        (st.capturedEl as any).releasePointerCapture?.(st.pointerId);
      }
    } catch (err: any) {
      this._logPicker('release-capture-throw', { msg: String(err?.message||err) });
    }
  }

  private _clearPickerTimer() {
    if (this._pickerTimer) {
      clearTimeout(this._pickerTimer);
      this._pickerTimer = null;
    }
  }

  private _openPicker(cell: BoardCell) {
    if (!this._pickerState) return;
    // 1. seleziona la cella se non lo è già
    this._element?.nativeElement.focus();
    if (this.manager?.selection$.value?.id !== cell.id) {
      this._updateSelection(cell);
    }
    // 2. annulla l'hold-state della toolbar se attivo (long-press cella ha priorità)
    if (this.manager?.status$.value.isLock) {
      this.manager.options({ isLock: false });
    }
    // 3. apri il picker
    this._pickerState.open = true;
    this.pickerValues$.next(this._pickerState.values);
    this.pickerHoveredIndex$.next(-1);
    this.pickerCenter$.next({ x: this._pickerState.centerX, y: this._pickerState.centerY });
    this.pickerRadius$.next(this._pickerState.radius);
    this.pickerOpen$.next(true);
    this._logPicker('picker-open', {
      stillHasCapture: this._pickerHasCapture(),
      activeElement: (document.activeElement?.tagName||'') + (document.activeElement?.id ? '#'+document.activeElement.id : ''),
    });
  }

  private _closePicker(reason: string = 'unknown') {
    this._logPicker('picker-close', { reason });
    this.pickerOpen$.next(false);
    this.pickerHoveredIndex$.next(-1);
    this.previewCellId$.next('');
    this.previewValue$.next('');
  }

  private _updatePickerHovered(px: number, py: number) {
    const st = this._pickerState;
    if (!st || !st.open) return;
    const dx = px - st.centerX;
    const dy = py - st.centerY;
    const dist = Math.hypot(dx, dy);
    const deadZone = st.radius * PICKER_DEAD_ZONE_RATIO;
    let idx = -1;
    // dentro la corona [deadZone .. radius]: scegli un segmento; fuori: annulla
    if (dist >= deadZone && dist <= st.radius) {
      const n = st.values.length;
      const slice = (Math.PI * 2) / n;
      // angle relativo a Nord (12 in punto), in senso orario
      let angle = Math.atan2(dx, -dy); // 0 = nord, PI/2 = est
      if (angle < 0) angle += Math.PI * 2;
      idx = Math.floor((angle + slice / 2) / slice) % n;
    }
    if (idx !== st.hoveredIndex) {
      this._logPicker('hover-change', {
        from: st.hoveredIndex,
        to: idx,
        dist: Math.round(dist),
        deadZone: Math.round(deadZone),
        radius: Math.round(st.radius),
        value: idx >= 0 ? st.values[idx] : null,
      });
      st.hoveredIndex = idx;
      this.pickerHoveredIndex$.next(idx);
      // pre-commit preview nella cella
      if (idx >= 0) {
        this.previewCellId$.next(st.cell.id);
        this.previewValue$.next(st.values[idx]);
      } else {
        this.previewCellId$.next('');
        this.previewValue$.next('');
      }
    }
  }

  private _commitPickerValue(cell: BoardCell, value: string) {
    const isEffectivePencil = this.status.editMode === 'play' && this.status.isPencil;
    // in pencil + empty l'utente vuole svuotare anche i user-values della cella
    const userValues = isEffectivePencil && value === '' ? [] : [...(cell.userValues || [])];
    const request = new BoardChangeEvent({
      value,
      userValues,
      cell: _clone(cell),
      status: new BoardEventStatus({ ...this.status, isCtrl: false })
    });
    if (this.status.isDebug) console.log(...BOARD_PREFIX, 'picker commit', request);
    this._logPicker('picker-commit', { cell: cell.id, value, isEffectivePencil });
    this.boardChangeRequest.emit(request);
  }

  // === DEBUG REPORT helpers (radial-picker) =================================

  private _pickerHasCapture(): boolean {
    const st = this._pickerState;
    if (!st) return false;
    try { return !!(st.capturedEl as any).hasPointerCapture?.(st.pointerId); }
    catch { return false; }
  }

  private _logPicker(tag: string, payload?: any) {
    if (!BoardComponent.PICKER_DEBUG || !this._pickerLogActive) return;
    const t = (performance.now() - this._pickerLogT0).toFixed(1);
    let line = `[+${t.padStart(7)}ms] ${tag}`;
    if (payload !== undefined) {
      try { line += ' ' + JSON.stringify(payload); }
      catch { line += ' [unserializable]'; }
    }
    this._pickerLog.push(line);
    if (this._pickerLog.length > 5000) this._pickerLog.splice(0, 1000);
  }

  private _roundRect(r: DOMRect): any {
    return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  }

  private _evInfoPointer(e: PointerEvent, st?: PickerState | null): any {
    const o: any = {
      pid: e.pointerId,
      ptype: e.pointerType,
      primary: e.isPrimary,
      btn: e.button,
      btns: e.buttons,
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
      pressure: e.pressure,
    };
    if (st) {
      const dx = e.clientX - st.centerX;
      const dy = e.clientY - st.centerY;
      o.dCenter = Math.round(Math.hypot(dx, dy));
      o.hasCapture = (() => { try { return !!(st.capturedEl as any).hasPointerCapture?.(st.pointerId); } catch { return null; } })();
    }
    const tg = e.target as Element | null;
    if (tg) o.tgt = tg.tagName + (tg.classList?.length ? '.' + tg.classList[0] : '');
    return o;
  }

  private _evInfoTouch(e: TouchEvent): any {
    const tl = e.changedTouches?.[0];
    const o: any = { touches: e.touches?.length, changed: e.changedTouches?.length, cancelable: e.cancelable };
    if (tl) { o.x = Math.round(tl.clientX); o.y = Math.round(tl.clientY); }
    return o;
  }

  private _pickerLogStart(cell: BoardCell, e: PointerEvent, target: Element) {
    if (!BoardComponent.PICKER_DEBUG) return;
    this._pickerLog = [];
    this._pickerLogT0 = performance.now();
    this._pickerLogActive = true;
    const tg = target as any;
    const css = (typeof getComputedStyle === 'function') ? getComputedStyle(tg) : null;
    this._pickerLog.push('=== RADIAL PICKER DEBUG REPORT ===');
    this._pickerLog.push(`when      : ${new Date().toISOString()}`);
    this._pickerLog.push(`ua        : ${navigator.userAgent}`);
    this._pickerLog.push(`viewport  : ${window.innerWidth}x${window.innerHeight} dpr=${window.devicePixelRatio}`);
    this._pickerLog.push(`pointer   : type=${e.pointerType} primary=${e.isPrimary} btn=${e.button} btns=${e.buttons} pid=${e.pointerId}`);
    this._pickerLog.push(`target    : ${tg.tagName}.${(tg.classList||[])[0]||''}  has-svgRoot=${!!(tg.ownerSVGElement)}`);
    if (css) {
      this._pickerLog.push(`tgt-style : touch-action=${css.touchAction}  user-select=${css.userSelect}  -webkit-user-select=${(css as any).webkitUserSelect}`);
    }
    this._pickerLog.push(`status    : editMode=${this.status.editMode} isPencil=${this.status.isPencil} isDynamic=${this.status.isDynamic} isLock=${this.status.isLock}`);
    this._pickerLog.push(`cell      : id=${cell.id} fixed=${cell.isFixed} dynamic=${cell.isDynamic}`);
    this._pickerLog.push('--- timeline ---');
    this._logPicker('rect:pointerdown', this._evInfoPointer(e));
    this._attachPickerListeners(target, e.pointerId);
  }

  private _attachPickerListeners(target: Element, pointerId: number) {
    const add = (tg: any, type: string, fn: any, opts?: any) => {
      tg.addEventListener(type, fn, opts);
      this._pickerWinHandlers.push({ target: tg, type, fn, opts });
    };
    // capture lifecycle sul target
    add(target, 'gotpointercapture', (e: PointerEvent) => this._logPicker('tgt:gotpointercapture', { pid: e.pointerId }));
    add(target, 'lostpointercapture', (e: PointerEvent) => this._logPicker('tgt:lostpointercapture', { pid: e.pointerId, hasNow: (() => { try { return !!(target as any).hasPointerCapture?.(e.pointerId); } catch { return null; } })() }));
    add(target, 'pointerleave', (e: PointerEvent) => this._logPicker('tgt:pointerleave', this._evInfoPointer(e, this._pickerState)));
    add(target, 'pointerout', (e: PointerEvent) => this._logPicker('tgt:pointerout', this._evInfoPointer(e, this._pickerState)));

    // window/document: vediamo se gli eventi arrivano qui invece che al target
    const onWinPointer = (tag: string) => (e: PointerEvent) => {
      const st = this._pickerState;
      if (st && e.pointerId !== st.pointerId) return;
      this._logPicker(tag, this._evInfoPointer(e, st));
    };
    add(window, 'pointermove', onWinPointer('win:pointermove'), true);
    add(window, 'pointerup', onWinPointer('win:pointerup'), true);
    add(window, 'pointercancel', onWinPointer('win:pointercancel'), true);

    // touch events: se Android emette anche questi può rivelare scroll/gestures
    add(document, 'touchstart', (e: TouchEvent) => this._logPicker('doc:touchstart', this._evInfoTouch(e)), { passive: true, capture: true });
    add(document, 'touchmove', (e: TouchEvent) => this._logPicker('doc:touchmove', this._evInfoTouch(e)), { passive: true, capture: true });
    add(document, 'touchend', (e: TouchEvent) => this._logPicker('doc:touchend', this._evInfoTouch(e)), { passive: true, capture: true });
    add(document, 'touchcancel', (e: TouchEvent) => this._logPicker('doc:touchcancel', this._evInfoTouch(e)), { passive: true, capture: true });

    // gesture interferenti
    add(document, 'contextmenu', (e: Event) => this._logPicker('doc:contextmenu', { tgt: (e.target as Element)?.tagName }), true);
    add(document, 'selectstart', (e: Event) => this._logPicker('doc:selectstart', { tgt: (e.target as Element)?.tagName }), true);
    add(document, 'dragstart', (e: Event) => this._logPicker('doc:dragstart', { tgt: (e.target as Element)?.tagName }), true);
    add(window, 'scroll', () => this._logPicker('win:scroll', { x: window.scrollX, y: window.scrollY }), { passive: true, capture: true });
    add(document, 'visibilitychange', () => this._logPicker('doc:visibilitychange', { state: document.visibilityState }));
    add(window, 'blur', () => this._logPicker('win:blur'));
  }

  private _detachPickerListeners() {
    for (const h of this._pickerWinHandlers) {
      try { h.target.removeEventListener(h.type, h.fn, h.opts); } catch { /* noop */ }
    }
    this._pickerWinHandlers = [];
  }

  private _pickerLogEnd(reason: string) {
    if (!BoardComponent.PICKER_DEBUG || !this._pickerLogActive) return;
    this._logPicker('=== END ===', { reason });
    this._detachPickerListeners();
    this._pickerLogActive = false;
    const text = this._pickerLog.join('\n');
    let copied = false;
    try { copied = this._clipboard.copy(text); } catch { copied = false; }
    if (!copied && (navigator as any).clipboard?.writeText) {
      try { (navigator as any).clipboard.writeText(text); copied = true; } catch { /* noop */ }
    }
    // notifica solo se il picker era stato realmente aperto, per non disturbare i tap brevi
    const wasOpen = this._pickerLog.some(l => l.includes('picker-open'));
    if (wasOpen) {
      this._notifier.notify(
        `Picker debug: ${this._pickerLog.length} entries ${copied ? 'copied to clipboard' : '(copy failed — see console)'}`,
        copied ? NotificationType.success : NotificationType.warning
      );
      if (!copied) console.log('[PICKER DEBUG]\n' + text);
    }
  }

  private _getPickerValues(): string[] {
    const s = this.status;
    const base = ['1','2','3','4','5','6','7','8','9'];
    if (s.editMode === 'schema' && s.isDynamic) {
      return [...base, '', '?'];
    }
    return [...base, ''];
  }

  copySchemaToClipboard() {
    this._clipboard.copy(getCellsSchema(this.cells$.value, { allowDynamic: !!this.status?.isDynamic }));
    this._notifier.notify('Schema copied to clipboard successfully', NotificationType.success);
  }

  private _move(code: string, mode?: BoardNextMode) {
    const current = this.manager?.selection$.value;
    if (!current) return;
    const target = moveOnDirection(code, current, mode);
    const cell = <BoardCell>getCell(this.cells$.value, target);
    if (cell?.id !== current?.id) this._updateSelection(cell);
  }

  private _handleKeyboardEvents(e: KeyboardEvent) {
    if (this.status.isDebug) console.log(...BOARD_PREFIX, 'BOARD KEY EVENT', e.key, '\nORIGINAL', e);
    if (isDirectionKey(e)) {
      this._move(e.code, this.status.nextMode);
    } else {
      // COPIA LO SCHEMA IN CLIPBOARD
      if (isCopyKeys(e)) return this.copySchemaToClipboard();
      // NEXT STEP
      if (isNextStepKey(e)) return this.manager?.execOperation('solve-step');
      // SKIPPED KEYS
      if (isSkippedKey(e.code)) return;
      const cell = this.manager?.selection$.value;
      if (this.status.editMode === 'play' && cell?.isFixed) {
        this._move(NEXT_DIRECTION, this.status.nextMode);
        return;
      }
      const isEffectivePencil = this.status.editMode === 'play' && this.status.isPencil;
      let userValues: string[] = [...cell?.userValues||[]];
      if (isDeleteKey(e.code) && isEffectivePencil) userValues = [];
      const request = new BoardChangeEvent({
        value: isDeleteKey(e.code) ? '' : e.key,
        userValues,
        cell: _clone(cell),
        status: new BoardEventStatus({
          ...this.status,
          isCtrl: e.ctrlKey
        })
      });
      if (this.status.isDebug) console.log(...BOARD_PREFIX, 'board cell changes request', request);
      this.boardChangeRequest.emit(request);
      this._move(NEXT_DIRECTION, this.status.nextMode);
    }
  }
}


const getColRow = (v: any): number => (_isNumber(v) && v > -1 && v < DEFAULT_RANK) ? v : -1;
