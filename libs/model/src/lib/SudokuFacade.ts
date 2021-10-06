import { BehaviorSubject, Observable } from 'rxjs';
import {Facade} from "./Facade";
import {SudokuMessage} from "./SudokuMessage";
import {SudokulabPage} from "./SudokulabPage";
import { Dictionary } from '@ngrx/entity';
import { Type } from '@angular/core';
import { Sudoku } from './Sudoku';
import { UploadDialogOptions } from './UploadDialogOptions';
import { UploadDialogResult } from './UploadDialogResult';


export abstract class SudokuFacade implements Facade {
  name = 'sudoku';
  abstract selectActiveMessage$: Observable<SudokuMessage|undefined>;
  abstract selectActivePage$: Observable<SudokulabPage|undefined>;
  abstract selectPageStatus$: Observable<Dictionary<boolean>>;
  abstract selectIsCompact$: Observable<boolean>;

  abstract setActivePage(page: SudokulabPage|undefined, data?: any): void;
  abstract raiseMessage(message: SudokuMessage): void;
  abstract raiseError(err: any): void;
  abstract upload(open?: boolean): void;
  abstract fillDocuments(): void;
  abstract onUpload(component: Type<any>, destroyer$: Observable<any>, options?: UploadDialogOptions): Observable<UploadDialogResult|any>;
  abstract checkCompactStatus(): void;
  abstract saveUserSettings(): void;
}
