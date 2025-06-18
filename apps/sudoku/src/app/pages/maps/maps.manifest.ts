import { SudokuPageManifest } from '@olmi/common';
import { MAIN, NARROW } from './maps.menu';

export const MAPS_PAGE_ROUTE = 'maps';

export class MapsPageManifest extends SudokuPageManifest {
  title = 'Maps';
  route = MAPS_PAGE_ROUTE;
  menu = MAIN;
  narrowMenu = NARROW;
  icon = 'map';
}
