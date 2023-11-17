export enum SudokuSymmetry {
  none = 'none',
  vertical = 'vertical',
  horizontal = 'horizontal',
  doubleMedian = 'doubleMedian',
  diagonalNWSE = 'diagonalNWSE',
  diagonalNESW = 'diagonalNESW',
  doubleDiagonal = 'doubleDiagonal',
  central = 'central'
}

export enum SudokuGroupType {
  column = 'column',
  row = 'row',
  square = 'square'
}

export enum PlaySudokuCellAlignment {
  none = 'none',
  vertical = 'vertical',
  horizontal = 'horizontal',
}

export enum Algorithms {
  oneCellForValue = 'OneCellForValue',
  oneValueForCell = 'OneValueForCell',
  alignmentOnGroup = 'AlignmentOnGroup',
  tryNumber = 'TryNumber'
}

export enum AlgorithmType {
  solver = 'solver',
  support = 'support'
}

export enum MoveDirection {
  up = 'up',
  down = 'down',
  right = 'right',
  left = 'left',
  next = 'next',
  prev = 'prev'
}

export enum MessageType {
  info = 'info',
  success = 'success',
  warning = 'warning',
  error = 'error',
  highlight = 'highlight'
}

export enum SudokuEndGenerationMode {
  manual = 'manual',
  afterN = 'afterN',
  afterTime = 'afterTime'
}

export enum SudokuValorizationMode {
  auto = 'auto',
  sequential = 'sequential',
  random = 'random'
}
