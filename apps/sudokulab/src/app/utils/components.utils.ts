import { get as _get, sortBy as _sortBy } from 'lodash';
import { PlaySudoku, SchemasOptions } from '@sudokulab/model';

export const filterSchemas = (schemas: PlaySudoku[], options: SchemasOptions) => {
  let sch = (schemas || []).filter(s => options.try || !s.sudoku?.info.useTryAlgorithm);
  if (!!options.sortBy) sch = _sortBy(sch, s => _get(s, options.sortBy));
  if (options.asc) sch.reverse();
  return sch;
}
