import { SudokuDto } from '../../model/sudoku.dto';

export const validate = (sdk: SudokuDto): string => {
  if ((sdk?._id||0) === 0) return `wrong identity`;
  if ((sdk?.fixed||'') === '') return `empty fixed string`;
  // check logics...

  return null;
}
