import { ButtonsStatus, MenuItem, Sudoku, SudokuStat, SYSTEM_MENU_ITEMS } from '@olmi/model';
import { BoardStatus } from '@olmi/board';

const CODE_SCHEMAS = 'button-code-schemas';
const BUTTON_KEEPER = 'button-code-keeper';
const CODE_SOLVE_TO_TRY_RULE = 'solve-to-try';
const CODE_SOLVE_STEP = 'solve-step';
const CODE_SOLVE_ALL = 'solve-all';

export const SOLVES = <MenuItem[]>[
  {
    code: CODE_SOLVE_ALL,
    text: `Solve all`,
    icon: 'play_arrow',
    operation: 'solve'
  },
  {
    code: CODE_SOLVE_STEP,
    text: `Solve next step`,
    icon: 'skip_next',
    operation: 'solve-step'
  },
  {
    code: 'solve-to-step-n',
    text: `Solve to a specific step`,
    icon: 'fast_forward',
    property: 'solve-to',
    logic: 'private'
  },
  {
    code: CODE_SOLVE_TO_TRY_RULE,
    text: `Solve to try`,
    icon: 'play_circle',
    operation: 'solve-to-try',
    logic: 'execute'
  },
];

const CODE_VALUES_MODE = 'values-mode';
const CODE_NEXT_MODE = 'next-mode';
const CODE_AVAILABLE = 'is-available';
const CODE_COORD = 'is-coord';

export const OPERATIONS = <MenuItem[]>[
  {
    code: CODE_VALUES_MODE,
    property: 'valuesMode',
    logic: 'toggle',
    text: 'Values mode',
    icon: 'pin'
  },
  {
    code: CODE_NEXT_MODE,
    property: 'nextMode',
    logic: 'toggle',
    text: `Input mode`,
    icon: 'route'
  },
  {
    code: 'clear-highlights',
    property: 'clear-highlights',
    logic: 'private',
    text: `Clear highlights`,
    icon: 'delete_sweep'
  },
  {
    code: 'download-schema',
    text: `Download schema`,
    icon: 'file_download',
    property: 'download',
    logic: 'private'
  },
  {
    code: 'check-schema',
    text: `Check schema`,
    icon: 'cloud_sync',
    property: 'check',
    logic: 'private'
  },
  {
    separator: true
  },
  {
    code: CODE_AVAILABLE,
    property: 'isAvailable',
    logic: 'switch',
    text: `Available`,
    icon: 'apps'
  },
  {
    code: CODE_COORD,
    property: 'isCoord',
    logic: 'switch',
    text: `Coordinates`,
    icon: 'grid_4x4'
  },
  SYSTEM_MENU_ITEMS.globalDebug
]

const OPENSCHEMA = <MenuItem[]>[
  {
    code: BUTTON_KEEPER,
    icon: 'apps_outage',
    text: 'Open schema',
    logic: 'private',
    property: 'keeper'
  },
  {
    code: 'player-schema-random',
    icon: 'casino',
    text: 'Open random schema',
    logic: 'private',
    property: 'random'
  },
  {
    code: CODE_SCHEMAS,
    icon: 'grid_on',
    text: 'Available schemas',
    logic: 'private',
    property: 'browse'
  },
]

const CODE_SOLVE_HELP = 'solve-help';

export const MAIN = <MenuItem[]>[
  {
    code: 'player-solve',
    icon: 'playlist_play',
    text: 'Solve menu',
    subMenu: [
      ...SOLVES,
      {
        separator: true
      },
      {
        code: CODE_SOLVE_HELP,
        text: `Show next move`,
        icon: 'support',
        operation: 'help'
      },
    ]
  },
  {
    code: 'player-clear',
    operation: 'clear',
    icon: 'border_clear',
    text: 'Clear schema',
  },
  {
    separator: true
  },
  ...OPENSCHEMA,
  {
    code: 'player-operations',
    icon: 'more_vert',
    text: 'Player operations',
    subMenu: [
      ...OPERATIONS,
      {
        separator: true
      },
      SYSTEM_MENU_ITEMS.lightTheme,
      SYSTEM_MENU_ITEMS.darkTheme,
      SYSTEM_MENU_ITEMS.restoreSettings,
    ]
  },
]

export const NARROW = <MenuItem[]>[
  ...OPENSCHEMA,
  {
    separator: true
  },
  {
    code: CODE_SOLVE_HELP,
    text: `Show next move`,
    icon: 'support',
    operation: 'help'
  },
  {
    code: 'player-narrow-menu',
    icon: 'more_vert',
    text: 'menu',
    subMenu: [
      ...SOLVES,
      {
        separator: true
      },
      {
        code: 'player-clear',
        operation: 'clear',
        icon: 'border_clear',
        text: 'Clear schema',
      },
      {
        separator: true
      },
      ...OPERATIONS,
      {
        separator: true
      },
      SYSTEM_MENU_ITEMS.lightTheme,
      SYSTEM_MENU_ITEMS.darkTheme,
      SYSTEM_MENU_ITEMS.restoreSettings,
    ]
  },
]

export const calcStatusForMenu = (sdk: Sudoku|undefined, s: BoardStatus, stat: SudokuStat, filled: boolean): Partial<ButtonsStatus> => {
  return {
    hidden: {
      [CODE_SOLVE_TO_TRY_RULE]: !sdk?.info.useTryAlgorithm
    },
    disabled: {
      [CODE_SCHEMAS]: !filled,
      [CODE_SOLVE_STEP]: stat.isComplete,
      [CODE_SOLVE_HELP]: stat.isComplete,
      [CODE_SOLVE_ALL]: stat.isComplete,
    },
    active: {
      [CODE_AVAILABLE]: s.isAvailable,
      [CODE_COORD]: s.isCoord,
    },
    text: {
      [CODE_VALUES_MODE]: `Values as ${s.valuesMode}`,
      [CODE_NEXT_MODE]: `Input mode: ${s.nextMode}`,
    }
  }
}
