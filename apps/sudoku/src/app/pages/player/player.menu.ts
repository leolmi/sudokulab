import { Sudoku } from '@olmi/model';
import { MenuItem } from '@olmi/common';

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
  {
    code: 'sep-solve-1',
    separator: true
  },
  {
    code: 'solve-help',
    text: `Show next move`,
    icon: 'support',
    operation: 'help'
  }
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
    code: 'sep-operations-1',
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
  {
    code: 'sep-operations-2',
    separator: true
  },
  {
    code: 'is-pencil',
    property: 'isPencil',
    logic: 'switch',
    text: `Pencil`,
    icon: 'edit'
  },
]



export const MAIN = <MenuItem[]>[
  {
    code: 'player-sep-1',
    separator: true
  },
  {
    code: 'player-solve',
    icon: 'play_arrow',
    text: 'Solve',
    subMenu: SOLVES
  },
  {
    code: 'player-clear',
    operation: 'clear',
    icon: 'border_clear',
    text: 'Clear schema',
  },
  {
    code: 'player-operations',
    icon: 'more_vert',
    text: 'Player operations',
    subMenu: OPERATIONS
  },
  {
    code: 'player-sep-2',
    separator: true
  },
  {
    code: BUTTON_KEEPER,
    icon: 'apps_outage',
    text: 'Open schema',
    logic: 'private',
    property: 'keeper'
  },
  {
    code: BUTTON_SCHEMAS,
    icon: 'grid_on',
    text: 'Available schemas',
    logic: 'private',
    property: 'browse'
  },
]

export const NARROW = <MenuItem[]>[
  {
    code: 'player-narrow-menu',
    icon: 'more_vert',
    text: 'menu',
    subMenu: [
      ...SOLVES,
      {
        code: 'sep-solve-n-1',
        separator: true
      },
      {
        code: 'player-clear',
        operation: 'clear',
        icon: 'border_clear',
        text: 'Clear schema',
      },
      {
        code: 'sep-solve-n-2',
        separator: true
      },
      ...OPERATIONS,
      {
        code: 'sep-solve-n-3',
        separator: true
      },
      {
        code: BUTTON_KEEPER,
        icon: 'apps_outage',
        text: 'Open schema',
        logic: 'private',
        property: 'keeper'
      },
      {
        code: BUTTON_SCHEMAS,
        icon: 'grid_on',
        text: 'Available schemas',
        logic: 'private',
        property: 'browse'
      },
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
