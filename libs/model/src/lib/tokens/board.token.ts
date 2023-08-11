import {InjectionToken} from "@angular/core";
import {PlaySudoku} from "../PlaySudoku";
import {BehaviorSubject, Subject} from "rxjs";
import {AlgorithmResultLine} from "../AlgorithmResult";

export enum BoardAction {
  check = 'check',
  solve = 'solve',
  solveStep = 'solveStep',
  calcStep = 'calcStep',
  clear = 'clear',
  pencil = 'pencil',
  value = 'value',
  infoLine = 'infoLine',
}

export class BoardData {
  constructor() {
    this.isWorkerAvailable = typeof Worker !== 'undefined';
    this.sdk$ = new BehaviorSubject<PlaySudoku>(new PlaySudoku());
    this.activeCellId$ = new BehaviorSubject<string>('');
    this.action$ = new Subject<BoardAction>();
    this.value$ = new Subject<string>();
    this.info$ = new Subject<AlgorithmResultLine>();
  }

  sdk$: BehaviorSubject<PlaySudoku>;
  activeCellId$: BehaviorSubject<string>;
  action$: Subject<BoardAction>;
  value$: Subject<string>;
  isWorkerAvailable: boolean;
  info$: Subject<AlgorithmResultLine>;
}

export const BOARD_DATA = new InjectionToken<{}>('BOARD_DATA');
