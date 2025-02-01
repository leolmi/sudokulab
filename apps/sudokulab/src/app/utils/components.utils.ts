import { get as _get, sortBy as _sortBy } from 'lodash';
import {PlaySudoku, SchemasOptions, Sudoku} from '@sudokulab/model';

const matchTxt = (s: Sudoku, txt: string): boolean => {
  const str = `${s.fixed} ${s.name} ${s.info?.difficultyValue || ''} ${s.info?.symmetry || ''}`.toLowerCase();
  return str.indexOf((txt || '').toLowerCase()) > -1;
}

export const filterSchemas = (schemas: Sudoku[], options: SchemasOptions, txt?: string): Sudoku[] => {
  let sch = (schemas || []).filter(s => options.try || !s?.info?.useTryAlgorithm);
  if (!!options.sortBy) sch = _sortBy(sch, s => _get(s, options.sortBy));
  if (options.asc) sch.reverse();
  if (txt) sch = sch.filter(s => matchTxt(s, txt));
  return sch;
}
