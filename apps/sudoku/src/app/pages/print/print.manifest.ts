import { MAIN, NARROW } from './print.menu';
import { SudokuPageManifest } from '@olmi/common';

export const PRINT_PAGE_ROUTE = 'print';

export class PrintPageManifest extends SudokuPageManifest {
  title = 'Print';
  route = PRINT_PAGE_ROUTE;
  menu = MAIN;
  narrowMenu = NARROW;
  icon = 'print';
}
