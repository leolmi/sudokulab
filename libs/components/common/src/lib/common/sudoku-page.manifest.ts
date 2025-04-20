import { InjectionToken } from '@angular/core';
import { MenuItem } from '@olmi/model';


export abstract class SudokuPageManifest {
  abstract title: string;
  abstract route: string;
  abstract icon: string;
  abstract menu?: MenuItem[];
  abstract narrowMenu?: MenuItem[];
  lastRoute?: string;
  disabled?: boolean;
  default?: boolean;
}

export const SUDOKU_PAGES = new InjectionToken<SudokuPageManifest[]>('SUDOKU_PAGES');
