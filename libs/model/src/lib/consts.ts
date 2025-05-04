export const SUDOKU_AUTHOR_LINK = 'https://github.com/leolmi/sudokulab';
export const SUDOKU_AUTHOR_MAIL = 'leo.olmi@gmail.com';
export const DEFAULT_AVAILABLES = ['1','2','3','4','5','6','7','8','9'];
export const SDK_PREFIX = ['%cSudokuLab', 'color:#111;background-color:yellowgreen;padding:2px 6px;'];
export const SUDOKU_DEBUG_LEVELS_KEY = 'SUDOKULAB-DEBUG-LEVELS';
export const SUDOKU_APP_USER_OPTIONS_KEY = 'SUDOKULAB-USER-OPTIONS';
export const SUDOKU_USER_OPTIONS_FEATURE = 'sudoku_options';
export const SUDOKULAB_SESSION_DEVELOP = 'develop';
export const SUDOKULAB_SESSION_STANDARD = 'standard';
export const SUDOKULAB_TITLE = 'SudokuLab';
export const SUDOKULAB_AUTHOR = 'leo.olmi 2021';

export const THEME_LIGHT = 'light';
export const THEME_DARK = 'dark';
export const DEFAULT_THEME = THEME_LIGHT;
export const DEFAULT_RANK = 9;
export const DEFAULT_TOTAL_RANK = DEFAULT_RANK*DEFAULT_RANK;
export const SUDOKU_MIN_FIXED_CELLS = 14;
export const DEFAULT_PRINT_TEMPLATE = 'Couple-A4V';
export const DEFAULT_CATALOG_URL = 'assets/catalog.json';

export const GENERATOR_MIN_NUMBERS = 16;
export const GENERATOR_DEFAULT_NUMBERS = 24;
export const GENERATOR_MAX_NUMBERS = 40;
export const GENERATOR_MIN_WORKERS = 1;
export const GENERATOR_MAX_WORKERS = 10;


export const TRY_NUMBER_ALGORITHM = 'TryNumber';

export enum GroupType {
  column = 'column',
  row = 'row',
  square = 'square'
}

export const THEME_ICON: any = {
  [THEME_LIGHT]: 'light_mode',
  [THEME_DARK]: 'dark_mode'
}
export const THEME_OTHER: any = {
  [THEME_LIGHT]: THEME_DARK,
  [THEME_DARK]: THEME_LIGHT
}
export const THEME_CLASS: any = {
  [THEME_LIGHT]: 'theme-light',
  [THEME_DARK]: 'theme-dark'
}

export const AllGroupTypes = [GroupType.row, GroupType.column, GroupType.square];

export const GroupTypeMap: any = {
  col: GroupType.column,
  row: GroupType.row,
  sqr: GroupType.square
}

export const CellTypeBy: any = {
  [GroupType.column]: 'col',
  [GroupType.row]: 'row',
  [GroupType.square]: 'sqr',
}

/**
 * caratteri standard x schemi sudoku
 */
export const STANDARD_CHARACTERS: any = {
  dynamic: '?',
  dynamic2: 'x',
  empty: '0'
}

/**
 * tipologia di algoritmo
 */
export enum AlgorithmType {
  /**
   * risolutivo
   */
  solver = 'solver',
  /**
   * contributivo
   */
  support = 'support'
}

export enum Symmetry {
  none = 'none',
  vertical = 'vertical',
  horizontal = 'horizontal',
  doubleMedian = 'doubleMedian',
  diagonalNWSE = 'diagonalNWSE',
  diagonalNESW = 'diagonalNESW',
  doubleDiagonal = 'doubleDiagonal',
  central = 'central'
}

export enum EndGenerationMode {
  manual = 'manual',
  afterN = 'afterN',
  afterTime = 'afterTime'
}

export enum ValorizationMode {
  auto = 'auto',
  sequential = 'sequential',
  random = 'random'
}

export const DIFFICULTY_UNRATED = 'UNRATED';
export const DIFFICULTY_MAX = 'EXTREME';
export const DIFFICULTY_MIN = 'EASY';
export const DIFFICULTY_VALUES: any = {
  EASY: 600,
  MEDIUM: 800,
  HARD: 1000,
  VERYHARD: 1600,
  EXTREME: 1000000000
}
export const DIFFICULTY_RANGES = [
  {value: DIFFICULTY_VALUES.EASY, label: 'EASY'},
  {value: DIFFICULTY_VALUES.MEDIUM, label: 'MEDIUM'},
  {value: DIFFICULTY_VALUES.HARD, label: 'HARD'},
  {value: DIFFICULTY_VALUES.VERYHARD, label: 'VERYHARD'}
]


export const SYSTEM_MENU_CODE: any = {
  restoreSettings: 'system-restore-settings',
  darkTheme: 'system-dark-theme',
  lightTheme: 'system-light-theme',
  globalDebug: 'system-debug-mode',
  androidBottomBarBugFix: 'system-android-bbbf'
}

export const SYSTEM_MENU_ITEMS: any = {
  lightTheme: {
    code: SYSTEM_MENU_CODE.lightTheme,
    icon: 'light_mode',
    text: 'Switch to light theme',
    logic: 'system',
  },
  darkTheme: {
    code: SYSTEM_MENU_CODE.darkTheme,
    icon: 'dark_mode',
    text: 'Switch to dark theme',
    logic: 'system',
  },
  restoreSettings: {
    code: SYSTEM_MENU_CODE.restoreSettings,
    icon: 'settings_backup_restore',
    text: 'Restore default settings',
    logic: 'system',
  },
  globalDebug: {
    code: SYSTEM_MENU_CODE.globalDebug,
    icon: 'bug_report',
    text: 'Debug mode',
    logic: 'system',
  },
  androidBottomBarBugFix: {
    code: SYSTEM_MENU_CODE.androidBottomBarBugFix,
    icon: 'call_to_action',
    text: `Android Bottom Bar Fix`,
    logic: 'system',
  }
}
