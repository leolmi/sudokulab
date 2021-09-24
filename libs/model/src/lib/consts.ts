import { MoveDirection } from './enums';
import { Dictionary } from '@ngrx/entity';

export const featureName = 'sudoku';
export const SUDOKU_DYNAMIC_VALUE = 'x';
export const SUDOKU_EMPTY_VALUE = '0';

export const SDK_PREFIX = ['%cSUDOKULAB', 'color:orangered;'];

export const AVAILABLE_DIRECTIONS: Dictionary<MoveDirection> = {
  ArrowDown: MoveDirection.down,
  ArrowUp: MoveDirection.up,
  ArrowRight: MoveDirection.right,
  ArrowLeft: MoveDirection.left,
  Enter: MoveDirection.next,
  Backspace: MoveDirection.prev,
  '0': MoveDirection.next
}

export const AVAILABLE_VALUES = '123456789abcdefg'; // (max = 16x16)
