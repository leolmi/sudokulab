import {InjectionToken} from "@angular/core";
import {PlaySudoku} from "../PlaySudoku";
import {BehaviorSubject, Subject} from "rxjs";

export enum BoardAction {
  check = 'check',
  solve = 'solve',
  solveStep = 'solveStep',
  infoStep = 'infoStep',
  clear = 'clear',
  pencil = 'pencil',
  value = 'value',
}

export class BoardData {
  constructor() {
    this.isWorkerAvailable = typeof Worker !== 'undefined';
    this.sdk$ = new BehaviorSubject<PlaySudoku>(new PlaySudoku());
    this.activeCellId$ = new BehaviorSubject<string>('');
    this.action$ = new Subject<BoardAction>();
    this.value$ = new Subject<string>();
  }

  sdk$: BehaviorSubject<PlaySudoku>;
  activeCellId$: BehaviorSubject<string>;
  action$: Subject<BoardAction>;
  value$: Subject<string>;
  isWorkerAvailable: boolean;
}

export const BOARD_DATA = new InjectionToken<{}>('BOARD_DATA');
