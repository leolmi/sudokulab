import { get as _get, sortBy as _sortBy } from 'lodash';
import {PlaySudoku, SchemasOptions, Sudoku} from '@sudokulab/model';

export const filterSchemas = (schemas: Sudoku[], options: SchemasOptions): Sudoku[] => {
  let sch = (schemas || []).filter(s => options.try || !s?.info?.useTryAlgorithm);
  if (!!options.sortBy) sch = _sortBy(sch, s => _get(s, options.sortBy));
  if (options.asc) sch.reverse();
  return sch;
}
