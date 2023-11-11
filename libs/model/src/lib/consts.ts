import {MessageType, MoveDirection} from './enums';
import { Dictionary } from '@ngrx/entity';
import {SudokuMessage} from "./SudokuMessage";

export const featureName = 'sudoku';
export const SUDOKU_DYNAMIC_VALUE = 'x';
export const SUDOKU_DYNAMIC_VALUE2 = '?';
export const SUDOKU_EMPTY_VALUE = '0';
export const SUDOKU_DEFAULT_RANK = 9;
export const SUDOKU_DEFAULT_MAXSPLIT = 5000;

export const SUDOKULAB_LIGHT_THEME = 'light';
export const SUDOKULAB_DARK_THEME = 'dark';
export const SUDOKULAB_NUMBER_VALUES_MODE = 'number';

export const SUDOKULAB_SESSION_DEVELOP = 'develop';
export const SUDOKULAB_SESSION_STANDARD = 'standard';

export const SUDOKULAB_TITLE = 'SudokuLab';
export const SUDOKULAB_AUTHOR = 'leo.olmi 2021';
export const SUDOKULAB_SETTINGS_KEY = 'SUDOKULAB-USER-SETTINGS';
export const SUDOKULAB_DEBUG_KEY = 'SUDOKULAB-DEBUG-STATUS';
export const SUDOKULAB_DEFAULT_THEME = SUDOKULAB_LIGHT_THEME;
export const SUDOKULAB_DEFAULT_VALUES_MODE = SUDOKULAB_NUMBER_VALUES_MODE;
export const SUDOKULAB_BASIC_AUTHORIZATION = 'SUDOKULAB-BASIC';

export const SUDOKU_AUTHOR_LINK = 'https://github.com/leolmi/sudokulab';

export const SUDOKU_COMPACT_WIDTH_1 = 1450;
export const SUDOKU_COMPACT_WIDTH_2 = 640;


export const SDK_PREFIX = ['%cSUDOKULAB', 'color:steelblue;'];
export const SDK_PREFIX_DEBUG = ['%cSUDOKULAB', 'color:#ff4081;'];
export const SDK_PREFIX_W = ['\u001b[34m[SUDOKULAB]\u001b[0m'];

export const DELETE_VALUES = ['delete', 'Delete', '.', ' '];

export const SUDOKULAB_MANAGE_OPERATION = {
  resyncAll: 'resyncAll'
}

export const OPERATION_NEED_RELOAD_DOCS = {
  [SUDOKULAB_MANAGE_OPERATION.resyncAll]: true
}

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

export const DEFAULT_MESSAGES = {
  todo: new SudokuMessage({message: 'Not implemented yet', type: MessageType.warning}),
  solved: new SudokuMessage({message: 'Sudoku successfully solved!', type: MessageType.success})
}
