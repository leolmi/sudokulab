import { SudokuDto } from '../../model/sudoku.dto';

export const validate = (sdk: SudokuDto): boolean => {
  if ((sdk?._id||0) === 0) return false;
  if ((sdk?.fixed||'') === '') return false;
  // check logics...

  return true;
}
