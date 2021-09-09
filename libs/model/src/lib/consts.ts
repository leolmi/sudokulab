import { MoveDirection } from './enums';
import { Dictionary } from '@ngrx/entity';

export const featureName = 'sudoku';

export const AVAILABLE_DIRECTIONS: Dictionary<MoveDirection> = {
  ArrowDown: MoveDirection.down,
  ArrowUp: MoveDirection.up,
  ArrowRight: MoveDirection.right,
  ArrowLeft: MoveDirection.left,
  Enter: MoveDirection.next,
  '0': MoveDirection.next
}
