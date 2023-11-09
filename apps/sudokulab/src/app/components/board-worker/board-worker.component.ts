import {ChangeDetectionStrategy, Component, Inject, Input, NgZone, OnDestroy} from "@angular/core";
import {DestroyComponent} from "../DestroyComponent";
import {
  BOARD_DATA,
  BoardAction,
  BoardData,
  BoardDataManager,
  BoardWorkerArgs,
  BoardWorkerData,
  BoardWorkerHighlights,
  getLabCodeAction,
  loadUserData,
  PlaySudoku,
  SudokuLab
} from "@sudokulab/model";
import {BehaviorSubject, Observable, of} from "rxjs";
import {debounceTime, distinctUntilChanged, filter, takeUntil, withLatestFrom} from "rxjs/operators";
import {isEmptyHihlights} from "./board-worker.logic";
import {MatDialog} from "@angular/material/dialog";
import {cloneDeep as _clone} from 'lodash';


@Component({
  selector: 'sudokulab-board-worker',
  templateUrl: './board-worker.component.html',
  styleUrls: ['./board-worker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardWorkerComponent extends DestroyComponent implements OnDestroy {
  // private readonly _worker: Worker|undefined;
  // private _manager: BoardDataManager;
  // highlights$: BehaviorSubject<BoardWorkerHighlights>;
  valueMode$: Observable<string>;

  @Input()
  emptyText: string = 'select a schema';

  constructor(public sudokuLab: SudokuLab,
              private _zone: NgZone,
              private _dialog: MatDialog,
              @Inject(BOARD_DATA) public board: BoardData) {
    super(sudokuLab);
    // this.highlights$ = new BehaviorSubject<BoardWorkerHighlights>(BoardWorkerHighlights.empty);
    this.valueMode$ = of(''); //_sudoku.selectValuesMode$.pipe(takeUntil(this._destroy$));
    if (!board.manager) {
      board.manager = new BoardDataManager(_zone, sudokuLab, board, { saveDataOnChanges: true });
    }

    // if (board.isWorkerAvailable) {
    //   // this._worker = new Worker(new URL('./board.worker', import.meta.url));
    //   // this._worker.onmessage = (e: MessageEvent) => {
    //   //   // console.log('MESSAGE FROM BOARD', e);
    //   //   const data = <BoardWorkerData>e.data;
    //   //   this._manager.handleWorkerSdk(data);
    //   //   if (data.message) sudokuLab.showMessage(data.message);
    //   //   this.highlights$.next(data.highlights || BoardWorkerHighlights.empty);
    //   //   if (data.infos) sudokuLab.state.stepInfos$.next(data.infos);
    //   // }
    // }

    // // carica i dati utente & effettua la verifica
    // board.sdk$
    //   .pipe(distinctUntilChanged((s1,s2) => s1?.id === s2?.id))
    //   .subscribe(s => { //setTimeout(() => {
    //     const sdk = loadUserData(s);
    //     board.sdk$.next(sdk);
    //     if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{sdk});
    //   });
    //   //}, 250));
    //
    // // intercetta le actions
    // board.action$.pipe(
    //   withLatestFrom(board.sdk$))
    //   .subscribe(([action, sdk]) => {
    //     if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{action, sdk});
    //   });
    //
    // // intercetta le info line
    // board.info$
    //   .pipe(filter(i => !!i), takeUntil(this._destroy$), withLatestFrom(board.sdk$))
    //   .subscribe(([info, sdk]) => {
    //     if (this._worker) this._worker.postMessage(<BoardWorkerArgs>{ sdk, action: BoardAction.infoLine, info});
    //   });

    // carica i dati utente
    // this._manager.init();

    // // chiude gli highlights
    // this.highlights$
    //   .pipe(filter(hl => !isEmptyHihlights(hl)),
    //     debounceTime(5000))
    //   .subscribe((hl) => {
    //     this.highlights$.next(BoardWorkerHighlights.empty)
    //   });

    // // intercetta i comandi dall'esterno
    // sudokuLab.internalCode$.pipe(
    //   takeUntil(this._destroy$),
    //   withLatestFrom(board.sdk$))
    //   .subscribe(([code, sdk]) => {
    //     const action = getLabCodeAction(code);
    //     // tenta di eseguire l'azione sul manager
    //     if (this._manager.handleAction(action)) return;
    //     // altrimenti delega allo worker
    //     if (!!action && this._worker) this._worker.postMessage(<BoardWorkerArgs>{ sdk, action });
    //   })

    // dopo ogni modifica elimina le info di step
    // this.board.manager?.changed$.pipe(debounceTime(250)).subscribe(() => sudokuLab.state.stepInfos$.next([]));

    _dialog.afterOpened.pipe(takeUntil(this._destroy$)).subscribe(() => board.manager?.data.disabled$.next(true));
    _dialog.afterAllClosed.pipe(takeUntil(this._destroy$)).subscribe(() => board.manager?.data.disabled$.next(false));
  }

  changed() {
    this.board.manager?.changed();
  }

  ngAfterViewInit() {
    this.board.manager?.init(() => new Worker(new URL('./board.worker', import.meta.url)));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    // this._manager.dispose();
  }
}

const updateSchema = (schema$: BehaviorSubject<PlaySudoku>, handler: (sdk: PlaySudoku) => boolean): void => {
  const sdk = _clone(schema$.value);
  if (handler(sdk)) schema$.next(sdk);
}
