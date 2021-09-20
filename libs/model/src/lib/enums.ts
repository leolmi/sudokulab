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
  error = 'error'
}

export enum EditSudokuEndGenerationMode {
  manual = 'manual',
  afterN = 'afterN',
  afterTime = 'afterTime'
}
