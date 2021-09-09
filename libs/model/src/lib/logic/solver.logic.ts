import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { SolveStepResult } from './SolveStepResult';
import { getAlgorithm, getAlgorithms, getAvailables } from '../../sudoku-helper';
import { cloneDeep as _clone, forEach as _forEach, remove as _remove, extend as _extend } from 'lodash';
import { Dictionary } from '@ngrx/entity';
import { SolveAllResult } from './SolveAllResult';
import { SudokuSolution } from '../SudokuSolution';

export class Solver {
  private _sdks: SudokuSolution[];

  constructor(sdk: PlaySudoku) {
    const csdk = _clone(sdk);
    clear(csdk);
    this._sdks = [new SudokuSolution(csdk)];
  }

  solve(): SolveAllResult {
    do {
      this._sdks.forEach(sol => {
        if (_canSolveOne(sol.sdk)) {
          const result = solveStep(sol.sdk);
          if (!!result?.sdk) {
            _extend(sol.sdk, result.sdk);
            if (!!result.result) {
              sol.algorithms.push(result.result);
              if ((result.result.cases||[]).length>0) {
                result.result.cases.forEach(c => {
                  const ps = new PlaySudoku({ sudoku: c });
                  checkAvailables(ps);
                  const ss = new SudokuSolution(ps);
                  this._sdks.push(ss);
                });
              }
            }
          }
        }
      });
    } while (_canSolve(this._sdks));
    return new SolveAllResult(this._sdks);
  }
}

const _canSolveOne = (sdk: PlaySudoku): boolean => {
  return !sdk.state.error && !sdk.state.complete;
};

const _canSolve = (sdks: SudokuSolution[]): boolean => {
  return !!(sdks||[]).find(sol => _canSolveOne(sol.sdk));
};

const _onSudoku = <T>(sdk: PlaySudoku, handler: (sdk: PlaySudoku) => T) => {
  const changes: PlaySudoku = <PlaySudoku>_clone(sdk || {});
  return handler(changes);
}

const _isValue = (v: string): boolean => (v||'')!=='';

export const checkAvailables = (ps: PlaySudoku|undefined) => {
  if (!ps) return;
  _forEach(ps.groups || {}, (g) => {
    if (!g) return;
    const values: Dictionary<boolean> = {};
    g.cells.forEach(c => _isValue(c.value) ? values[c.value] = true : null);
    g.cells.forEach(c => _remove(c.availables, av => values[av] || _isValue(c.value)));
  });
  _forEach(ps.groups || {}, (g) => {
    if (!g) return;
    g.availableOnCells = {};
    g.cells.forEach(c => {
      c.availables.forEach(av => {
        const avs = `${av}`;
        g.availableOnCells[avs] = g.availableOnCells[avs] || {};
        (g.availableOnCells[avs] || {})[c.id] = true;
      });
    });
  });
  ps.couples = {};
  ps.state.valuesCount = 0;
  ps.state.error = false;
  ps.state.complete = true;
  _forEach(ps.cells || {}, (c) => {
    if (!!c && c.availables.length === 2) {
      const cpid = c.availables.join('|');
      ps.couples[cpid] = ps.couples[cpid] || [];
      (ps.couples[cpid] || []).push(c);
    }
    if (!!c?.value) ps.state.valuesCount++;
    if (!!c) {
      c.error = (c.availables.length < 1 && !c.value);
      if (!!c.error) ps.state.error = true;
      if (!c.value) ps.state.complete = false;
    }
  });
  ps.state.percent = ((ps.state.valuesCount - ps.state.fixedCount) / (81 - ps.state.fixedCount)) * 100;
}


export const clear = (sdk: PlaySudoku): PlaySudoku => {
  return _onSudoku(sdk, (ps) => {
    _forEach(ps?.cells || {}, (c) => {
      if (!!c) {
        c.value = (c.fixed ? c.value : '');
        if (!c.fixed) c.availables = getAvailables(ps);
      }
    });
    checkAvailables(ps);
    return ps;
  });
}

export const applyAlgorithm = (sdk: PlaySudoku, aname: string): PlaySudoku|undefined => {
  return _onSudoku(sdk, (ps) => {
    const alg = getAlgorithm(aname);
    if (!alg) {
      console.warn(`Algorithm "${aname}" not found!`)
      return;
    }
    const result = alg.apply(ps);
    if (!result.applied) return;
    return ps;
  });
}

export const solveStep = (sdk: PlaySudoku|undefined, exclude: string[] = []): SolveStepResult|undefined => {
  if (sdk?.state.error) {
    console.warn('No algorithm can be applied!');
    return;
  }
  if (!sdk) return;
  return _onSudoku(sdk, (ps) => {
    let result: AlgorithmResult|undefined = undefined;
    const algorithm = getAlgorithms(exclude).find(alg => {
      result = alg?.apply(ps);
      return result?.applied;
    });
    if (!algorithm) {
      console.warn('No algorithm has been applied!');
      return;
    } else {
      console.log(`Algorithm "${algorithm.name}" successfully applied`, result);
    }
    return new SolveStepResult(ps, result);
  });
}

export const getDifficulty = (algs: AlgorithmResult[]): string => {

  return 'HIGH';
}
