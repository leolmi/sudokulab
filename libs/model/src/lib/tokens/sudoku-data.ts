import {BehaviorSubject, Subject} from "rxjs";
import {PlaySudoku} from "../PlaySudoku";
import {UserData} from "../UserData";

export class SudokuData<T> {
  constructor(ps?: Partial<PlaySudoku>) {
    this.isWorkerAvailable = typeof Worker !== 'undefined';
    this.disabled$ = new BehaviorSubject<boolean>(false);
    this.sdk$ = new BehaviorSubject<PlaySudoku>(new PlaySudoku(ps));
    this.activeCellId$ = new BehaviorSubject<string>('');
    this.value$ = new Subject<string>();
    this.action$ = new Subject<T>();
    this.userData$ = new BehaviorSubject<UserData|undefined>(undefined);
  }

  disabled$: BehaviorSubject<boolean>;
  sdk$: BehaviorSubject<PlaySudoku>;
  activeCellId$: BehaviorSubject<string>;
  value$: Subject<string>;
  isWorkerAvailable: boolean;
  action$: Subject<T>;
  userData$: BehaviorSubject<UserData|undefined>;
}
