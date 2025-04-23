import { ButtonsStatus, MenuItem, SYSTEM_MENU_ITEMS } from '@olmi/model';

const CODE_GENERATE = 'generator-generate';
const CODE_STOP = 'generator-stop';
const CODE_SKIP = 'generator-skip';

const GENERATOR_MENU = <MenuItem[]>[
  {
    code: CODE_GENERATE,
    property: 'generate',
    operation: 'generate',
    logic: 'execute',
    color: 'accent',
    icon: 'play_arrow',
    text: 'Start generation',
  },
  {
    code: CODE_STOP,
    logic: 'execute',
    property: 'stop',
    operation: 'stop',
    icon: 'stop',
    color: 'error',
    text: 'Stop generation',
  },
]

const CODE_CLEAR = 'generator-clear';
const CODE_BUILD = 'generator-build';
const CODE_LOCK = 'is-lock';

const EDIT_MENU = <MenuItem[]>[
  {
    code: CODE_CLEAR,
    operation: 'clear',
    icon: 'border_clear',
    text: 'Clear schema',
  },
  {
    code: CODE_BUILD,
    logic: 'execute',
    property: 'build',
    operation: 'build',
    icon: 'auto_fix_high',
    text: 'Generate a schema'
  },
  {
    code: CODE_LOCK,
    property: 'isLock',
    logic: 'switch',
    text: `Lock value`,
    icon: 'lock'
  },
]

export const MAIN = <MenuItem[]>[
  ...GENERATOR_MENU,
  {
    code: CODE_SKIP,
    logic: 'execute',
    property: 'skip',
    operation: 'skip',
    icon: 'redo',
    text: 'Skip schema',
  },
  {
    separator: true
  },
  ...EDIT_MENU,
  {
    separator: true
  },
  SYSTEM_MENU_ITEMS.lightTheme,
  SYSTEM_MENU_ITEMS.darkTheme,
  SYSTEM_MENU_ITEMS.restoreSettings,
];

export const NARROW = <MenuItem[]>[
  ...EDIT_MENU,
  {
    code: CODE_SKIP,
    logic: 'execute',
    property: 'skip',
    operation: 'skip',
    icon: 'redo',
    text: 'Skip schema',
  },
  {
    code: 'generator-narrow-menu',
    icon: 'more_vert',
    text: 'menu',
    subMenu: [
      ...GENERATOR_MENU,
      {
        separator: true
      },
      SYSTEM_MENU_ITEMS.lightTheme,
      SYSTEM_MENU_ITEMS.darkTheme,
      SYSTEM_MENU_ITEMS.restoreSettings,
    ]
  }
];

export const calcStatusForMenu = (running: boolean, stopping: boolean, multiSchema: boolean, locked: boolean): Partial<ButtonsStatus> => {
  return {
    hidden: {
      [CODE_STOP]: !running,
      [CODE_GENERATE]: running,
      [CODE_SKIP]: !running || !multiSchema,
    },
    disabled: {
      [CODE_LOCK]: running || stopping,
      [CODE_BUILD]: running || stopping || !multiSchema,
      [CODE_CLEAR]: running || stopping,
      [CODE_STOP]: stopping,
      [CODE_GENERATE]: running || stopping,
      [CODE_SKIP]: stopping
    },
    active: {
      [CODE_LOCK]: locked
    }
  }
}
