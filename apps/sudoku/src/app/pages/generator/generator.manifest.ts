import { SudokuPageManifest } from '../../model';
import { MAIN, NARROW } from './generator.menu';

export const GENERATOR_PAGE_ROUTE = 'generator';

export class GeneratorPageManifest extends SudokuPageManifest {
  title = 'Generator';
  route = GENERATOR_PAGE_ROUTE;
  menu = MAIN;
  narrowMenu = NARROW;
  icon = 'auto_fix_high';
}
