import { SudokuPageManifest } from '../../model';
import { MAIN, NARROW } from './player.menu';

export const PLAYER_PAGE_ROUTE = 'player';

export class PlayerPageManifest extends SudokuPageManifest {
  title = 'Player';
  route = PLAYER_PAGE_ROUTE;
  menu = MAIN;
  narrowMenu = NARROW;
  icon = 'grid_on';
}
