import { MenuItem, Sudoku, SYSTEM_MENU_ITEMS } from '@olmi/model';

const BUTTON_SCHEMAS = 'button-code-schemas';
const BUTTON_KEEPER = 'button-code-keeper';
const SOLVE_TO_TRY_RULE = 'solve-to-try';

export const SOLVES = <MenuItem[]>[
  {
    code: 'solve-all',
    text: `Solve all`,
    icon: 'play_arrow',
    operation: 'solve'
  },
  {
    code: 'solve-step',
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
    code: SOLVE_TO_TRY_RULE,
    text: `Solve to try`,
    icon: 'play_circle',
    operation: 'solve-to-try',
    logic: 'execute'
  },
];

export const OPERATIONS = <MenuItem[]>[
  {
    code: 'values-mode',
    property: 'valuesMode',
    logic: 'toggle',
    text: `Values as {value}`,
    isDynamicText: true,
    icon: 'pin'
  },
  {
    code: 'next-mode',
    property: 'nextMode',
    logic: 'toggle',
    text: `Input mode: {value}`,
    isDynamicText: true,
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
    separator: true
  },
  {
    code: 'is-available',
    property: 'isAvailable',
    logic: 'switch',
    text: `Available`,
    icon: 'apps'
  },
  {
    code: 'is-coord',
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
    code: BUTTON_SCHEMAS,
    icon: 'grid_on',
    text: 'Available schemas',
    logic: 'private',
    property: 'browse'
  },
]


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
        code: 'solve-help',
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
    code: 'solve-help',
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

export const calcStatusForSchemaDeps = (sdk?: Sudoku) => {
  return {
    [SOLVE_TO_TRY_RULE]: !!sdk?.info.useTryAlgorithm
  }
}

export const getStoreStatus = (filled: boolean) => {
 return {
    [BUTTON_SCHEMAS]: filled
 }
}
