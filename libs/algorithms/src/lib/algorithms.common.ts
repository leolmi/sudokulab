import {
  Algorithm,
  AlgorithmResult,
  AlgorithmResultLine,
  buildHighlights,
  checkStatus,
  Condition,
  getStat,
  Highlights,
  SudokuCell,
  SudokuGroup
} from '@olmi/model';
import { cloneDeep as _clone, isString as _isString, reduce as _reduce, remove as _remove } from 'lodash';

export const ALGORITHMS: Algorithm[] = [];
export const ALGORITHMS_MAP: {[id: string]: Algorithm} = {};

export const registerAlgorithm = (alg: Algorithm) => {
  ALGORITHMS.push(alg);
  ALGORITHMS.sort((a1,a2) => a1.priority - a2.priority);
  ALGORITHMS_MAP[alg.id] = alg;
}

export const applyAlgorithm = (alg: Algorithm,
                               cells: SudokuCell[],
                               handler: (res: AlgorithmResult) => void): AlgorithmResult => {
  const res = new AlgorithmResult({ algorithm: alg.id });
  handler(res);
  res.highlights = buildHighlights(res.highlights);
  if (res.applied) {
    if (alg.options.checkAvailableOnStep) checkStatus(cells);
    res.stat = getStat(cells);
    res.cellsSnapshot = _clone(cells);
  }
  return res;
}

export const onRemoved = (cell: SudokuCell, v: string|Condition, handler: (removed: string[]) => void) => {
  const condition = _isString(v) ? (cv: string) => cv === <string>v : <Condition>v;
  const removed = _remove(cell.available, condition);
  if (removed.length > 0) handler(removed);
}

export const getHighlights = (c: SudokuCell|string, ids?: string[], groups?: SudokuGroup[], cellValue?: any): Partial<Highlights> => {
  const cid = _isString(c) ? c : c?.id || '';
  return <Partial<Highlights>>{
    cell: { [cid]: true },
    secondaryCell: _reduce(ids||[], (m, id) => ({ ...m, [id]: true }), {}),
    groups: (groups||[]).map(g => ({...g})),
    cellValue
  }
}

export const getSingleResultLine = (c: SudokuCell|string, description: string, withValue = false) => [new AlgorithmResultLine({
  cell: _isString(c) ? c : c?.id || '',
  description,
  withValue
})];
