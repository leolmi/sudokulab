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

@Component({
  selector: 'sudoku-board',
  imports: [
    CommonModule,
    ClipboardModule
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('attr.focusable') focusable = '';
  @HostBinding('attr.tabIndex') tabIndex = 0;
  @ViewChild('board') board: ElementRef|undefined = undefined;

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
    if (!this.status.isPasteEnabled) return;
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
    if (isDirectionKey(e.code)) {
      this._move(e.code, this.status.nextMode);
    } else {
      // COPIA LO SCHEMA IN CLIPBOARD
      if (isCopyKeys(e)) return this.copySchemaToClipboard();
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
