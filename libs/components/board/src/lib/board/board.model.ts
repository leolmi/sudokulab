import { DEFAULT_RANK, GroupType, SudokuCell, SudokuGroup } from '@olmi/model';

export const PLAYER_BOARD_USER_OPTIONS_FEATURE = 'player_board';
export const PLAYER_BOARD_USER_VALUES_PREFIX_KEY = 'SUDOKULAB-';
export const GENERATOR_BOARD_USER_OPTIONS_FEATURE = 'generator_board';
export const GENERATOR_OPTIONS_FEATURE = 'generator_options';

export enum MoveDirection {
  up = 'up',
  down = 'down',
  right = 'right',
  left = 'left',
  next = 'next',
  prev = 'prev'
}



export const NEXT_DIRECTION = '0';
export const AVAILABLE_DIRECTIONS: { [code: string]: MoveDirection } = {
  ArrowDown: MoveDirection.down,
  ArrowUp: MoveDirection.up,
  ArrowRight: MoveDirection.right,
  ArrowLeft: MoveDirection.left,
  Enter: MoveDirection.next,
  NumpadEnter: MoveDirection.next,
  Backspace: MoveDirection.prev,
  [NEXT_DIRECTION]: MoveDirection.next
}

export const SKIPPED_KEYS: any = {
  ControlLeft: true,
  ControlRight: true,
  AltLeft: true,
  AltRight: true,
  ShiftLeft: true,
  ShiftRight: true
}
export const DELETE_KEY = 'Delete';

export interface BoardGeometry {
  cell: {
    width: number;
    height: number;
  },
  line: {
    big: number;
    thin: number;
  },
  values: {[pos: string]: {x: number, y: number}|undefined},
  lines: {
    big: { id: number; x1:number; y1: number; x2: number; y2: number}[]
  },
  coords: {text: string, x: number, y: number, row?: number, col?: number}[]
}

const cd = -4;

export const GEOMETRY: BoardGeometry = {
  cell: {
    width: 10,
    height: 10
  },
  line: {
    big: .3,
    thin: .05
  },
  values: {
    '1': {x:1.5, y:3},
    '2': {x:4.5, y:3},
    '3': {x:7.5, y:3},
    '4': {x:1.5, y:6},
    '5': {x:4.5, y:6},
    '6': {x:7.5, y:6},
    '7': {x:1.5, y:9},
    '8': {x:4.5, y:9},
    '9': {x:7.5, y:9},
  },
  lines: {
    big: [
      { id: 1, x1: 30, y1: 0, x2: 30, y2: 90 },
      { id: 2, x1: 60, y1: 0, x2: 60, y2: 90 },
      { id: 3, x1: 0, y1: 30, x2: 90, y2: 30 },
      { id: 4, x1: 0, y1: 60, x2: 90, y2: 60 }
    ]
  },
  coords: [
    { text: '1', x: 5, y: cd, col: 0 },
    { text: '2', x: 15, y: cd, col: 1 },
    { text: '3', x: 25, y: cd, col: 2 },
    { text: '4', x: 35, y: cd, col: 3 },
    { text: '5', x: 45, y: cd, col: 4 },
    { text: '6', x: 55, y: cd, col: 5 },
    { text: '7', x: 65, y: cd, col: 6 },
    { text: '8', x: 75, y: cd, col: 7 },
    { text: '9', x: 85, y: cd, col: 8 },
    { text: 'A', y: 5, x: cd, row: 0 },
    { text: 'B', y: 15, x: cd, row: 1 },
    { text: 'C', y: 25, x: cd, row: 2 },
    { text: 'D', y: 35, x: cd, row: 3 },
    { text: 'E', y: 45, x: cd, row: 4 },
    { text: 'F', y: 55, x: cd, row: 5 },
    { text: 'G', y: 65, x: cd, row: 6 },
    { text: 'H', y: 75, x: cd, row: 7 },
    { text: 'I', y: 85, x: cd, row: 8 },
  ]
}

export const DEFAULT_NEXT_MODE = 'none';
export type BoardNextMode = 'none'|'next-in-row'|'next-in-square';

export const DEFAULT_VALUES_MODE: BoardValuesMode = 'numbers';
export type BoardValuesMode = 'numbers'|'dots';

export const DEFAULT_EDIT_MODE: BoardEditMode = 'play';
export type BoardEditMode = 'play'|'schema';



export class BoardCell extends SudokuCell {
  constructor(c?: Partial<BoardCell>) {
    super(c);

    this.textX = c?.textX||0;
    this.textY = c?.textY||0;
  }

  textX: number;
  textY: number;

  getValues(status: BoardStatus): string[] {
    return (this.userValues.length > 0) ? this.userValues : (status.isAvailable ? this.available : []);
  }
}

const calcGroupX = (g: BoardGroup) => {
  switch (g.type) {
    case GroupType.column:
      return g.pos * GEOMETRY.cell.width;
    case GroupType.square:
      return (g.pos % 3) * GEOMETRY.cell.width * 3;
    case GroupType.row:
    default:
      return 0;
  }
}
const calcGroupY = (g: BoardGroup) => {
  switch (g.type) {
    case GroupType.column:
      return 0;
    case GroupType.square:
      return Math.floor(g.pos/3) * GEOMETRY.cell.height * 3;
    case GroupType.row:
    default:
      return g.pos * GEOMETRY.cell.height;
  }
}
const calcGroupW = (g: BoardGroup) => {
  switch (g.type) {
    case GroupType.column:
      return GEOMETRY.cell.width;
    case GroupType.square:
      return GEOMETRY.cell.width * 3;
    case GroupType.row:
    default:
      return GEOMETRY.cell.width * DEFAULT_RANK;
  }
}
const calcGroupH = (g: BoardGroup) => {
  switch (g.type) {
    case GroupType.column:
      return GEOMETRY.cell.height * DEFAULT_RANK;
    case GroupType.square:
      return GEOMETRY.cell.height * 3;
    case GroupType.row:
    default:
      return GEOMETRY.cell.height;
  }
}

export class BoardGroup extends SudokuGroup {
  constructor(g?: Partial<BoardGroup>) {
    super(g);
    this.x = this.x||calcGroupX(this);
    this.y = this.y||calcGroupY(this);
    this.width = this.width||calcGroupW(this);
    this.height = this.height||calcGroupH(this);
  }

  width: number = 0;
  height: number = 0;
}

export class BoardStatus {
  constructor(s?: Partial<BoardStatus>) {
    Object.assign(<any>this, s || {});

    this.isDebug = !!s?.isDebug;
    this.isPencil = !!s?.isPencil;
    this.isDisabled = !!s?.isDisabled;
    this.isAvailable = !!s?.isAvailable;
    this.isDynamic = !!s?.isDynamic;
    this.isCoord = !!s?.isCoord;
    this.isLock = !!s?.isLock;
    this.isNotify = !!s?.isNotify;
    this.isPasteEnabled = !!s?.isPasteEnabled;

    this.nextMode = s?.nextMode||DEFAULT_NEXT_MODE;
    this.editMode = s?.editMode||DEFAULT_EDIT_MODE;
    this.valuesMode = s?.valuesMode||DEFAULT_VALUES_MODE;
  }

  isDebug: boolean;
  isPencil: boolean;
  isDisabled: boolean;
  isAvailable: boolean;
  isDynamic: boolean;
  isCoord: boolean;
  isLock: boolean;
  isNotify: boolean;
  isPasteEnabled: boolean;

  nextMode: BoardNextMode;
  editMode: BoardEditMode;
  valuesMode: BoardValuesMode;
}

export class BoardEventStatus extends BoardStatus {
  constructor(s?: Partial<BoardEventStatus>) {
    super(s);
    this.isCtrl = !!s?.isCtrl;
  }

  isCtrl: boolean;
}


export class BoardChangeEvent {
  constructor(c?: Partial<BoardChangeEvent>) {
    Object.assign(<any>this, c || {});
    this.status = new BoardEventStatus(c?.status);
    this.value = c?.value||'';
    this.userValues = c?.userValues||[];
  }

  value: string;
  userValues: string[];
  status: BoardEventStatus;
  cell: BoardCell|undefined;
}
