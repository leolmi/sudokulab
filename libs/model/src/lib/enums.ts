export enum SudokuSymmetry {
  none = 'none',
  vertical = 'vertical',
  horizontal = 'horizontal',
  diagonal = 'diagonal',
  doubleDiagonal = 'doubleDiagonal',
  central = 'central'
}

export enum PlaySudokuGroupType {
  column = 'column',
  row = 'row',
  square = 'square'
}

export enum Algorithms {
  oneCellForValue = 'OneCellForValue',
  oneValueForCell = 'OneValueForCell',
  tryNumber = 'TryNumber',
  twins = 'Twins',
}
