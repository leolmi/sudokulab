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
  }

  ngOnDestroy() {
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
    target.setPointerCapture(event.pointerId);
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
    this._clearPickerTimer();
    this._pickerTimer = setTimeout(() => {
      this._pickerTimer = null;
      if (!this._pickerState) return;
      this._pickerState.longPressFired = true;
      this._openPicker(cell);
    }, PICKER_LONG_PRESS_MS);
  }

  onPointerMove(event: PointerEvent) {
    const st = this._pickerState;
    if (!st || event.pointerId !== st.pointerId) return;
    if (!st.open) {
      // se il pointer si sposta troppo prima dello scatto, annulla il long-press
      const dx = event.clientX - st.startX;
      const dy = event.clientY - st.startY;
      if (Math.hypot(dx, dy) > PICKER_MOVE_TOLERANCE_PX) {
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
    this._clearPickerTimer();
    if (st.open) {
      if (st.hoveredIndex >= 0 && st.hoveredIndex < st.values.length) {
        this._commitPickerValue(st.cell, st.values[st.hoveredIndex]);
      }
      this._closePicker();
    } else if (!st.longPressFired) {
      // tap breve: equivalente al click, seleziona la cella
      this.select(st.cell);
    }
    this._releasePickerCapture();
    this._pickerState = null;
  }

  onPointerCancel(event: PointerEvent) {
    const st = this._pickerState;
    if (!st || event.pointerId !== st.pointerId) return;
    this._clearPickerTimer();
    if (st.open) this._closePicker();
    this._releasePickerCapture();
    this._pickerState = null;
  }

  private _releasePickerCapture() {
    const st = this._pickerState;
    if (!st) return;
    try {
      if ((st.capturedEl as any).hasPointerCapture?.(st.pointerId)) {
        (st.capturedEl as any).releasePointerCapture?.(st.pointerId);
      }
    } catch { /* noop */ }
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
  }

  private _closePicker() {
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
    this.boardChangeRequest.emit(request);
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
