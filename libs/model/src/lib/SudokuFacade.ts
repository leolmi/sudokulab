import { BehaviorSubject, Observable } from 'rxjs';
import {Facade} from "./Facade";
import {SudokuMessage} from "./SudokuMessage";
import {SudokulabPage} from "./SudokulabPage";
import { Dictionary } from '@ngrx/entity';
import { Type } from '@angular/core';
import { Sudoku } from './Sudoku';
import { UploadDialogOptions } from './UploadDialogOptions';
import { UploadDialogResult } from './UploadDialogResult';
import { HandleImageOptions } from './HandleImageOptions';
import { HandleImageResult } from './HandleImageResult';
import { CameraDialogOptions } from './CameraDialogOptions';
import { CameraDialogResult } from './CameraDialogResult';


export abstract class SudokuFacade implements Facade {
  name = 'sudoku';
  abstract selectActiveMessage$: Observable<SudokuMessage|undefined>;
  abstract selectActivePage$: Observable<SudokulabPage|undefined>;
  abstract selectPageStatus$: Observable<Dictionary<boolean>>;
  abstract selectIsCompact$: Observable<boolean>;
  abstract selectTheme$: Observable<string>;

  abstract loadSudoku(sudoku: Sudoku|undefined, onlyValues?: boolean): void;
  abstract loadSchema(schema: Sudoku): void;
  abstract setActivePage(page: SudokulabPage|undefined, data?: any): void;
  abstract checkSchema(o: HandleImageResult): void;
  abstract raiseMessage(message: SudokuMessage): void;
  abstract raiseError(err: any): void;
  abstract upload(open?: boolean): void;
  abstract fillDocuments(): void;
  abstract checkCompactStatus(): void;
  abstract saveUserSettings(): void;
  abstract checkStatus(): void;
  abstract setTheme(theme: string): void;
  abstract handleImage(o?: HandleImageOptions): void;
  abstract camera(): void;

  abstract onUpload(component: Type<any>, destroyer$: Observable<any>, options?: UploadDialogOptions): Observable<UploadDialogResult|any>;
  abstract onHandleImage(component: Type<any>, destroyer$: Observable<any>): void;
  abstract onCamera(component: Type<any>, destroyer$: Observable<any>, options?: CameraDialogOptions): void;
  abstract onCheckSchema(component: Type<any>, destroyer$: Observable<any>): void;
}
