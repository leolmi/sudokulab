import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult } from '../AlgorithmResult';
import { SolveStepResult } from './SolveStepResult';
import { applySudokuRules, getAlgorithm, getAlgorithms, getAvailables } from '../../sudoku.helper';
import { cloneDeep as _clone, extend as _extend, forEach as _forEach, reduce as _reduce, includes as _includes } from 'lodash';
import { Dictionary } from '@ngrx/entity';
import { SolveAllResult } from './SolveAllResult';
import { SudokuSolution } from '../SudokuSolution';
import { SudokuInfo } from '../SudokuInfo';
import { ALGORITHMS_FACTORS, DIFFICULTY_MAX, DIFFICULTY_RANGES, TRY_NUMBER_ALGORITHM } from '../Algorithms';
import { Algorithms } from '../enums';

export class Solver {
  private readonly _sdks: SudokuSolution[];

  constructor(sdk: PlaySudoku) {
    const csdk = clear(sdk);
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
                  ss.algorithms = _clone(sol.algorithms)||[];
                  this._sdks.push(ss);
                });
              }
            }
          } else {
            sol.sdk.state.error = true;
          }
        }
      });
    } while (_canSolve(this._sdks));
    return new SolveAllResult(this._sdks);
  }

  check(): string {
    const schema = this._sdks[0]?.sdk?.sudoku;
    if (!schema) return 'Undefined schema';
    if (this._sdks[0]?.sdk.state.fixedCount<11) return 'Too few fixed number to try solve it!';
    return '';
  }
}

const _canSolveOne = (sdk: PlaySudoku): boolean => {
  return !sdk.state.error && !sdk.state.complete;
};

const _canSolve = (sdks: SudokuSolution[]): boolean => {
  return (sdks || []).length < sdks[0].sdk.options.maxSplitSchema &&
    !!(sdks || []).find(sol => _canSolveOne(sol.sdk));
};

const _onSudoku = <T>(sdk: PlaySudoku, handler: (sdk: PlaySudoku) => T) => {
  const changes: PlaySudoku = <PlaySudoku>_clone(sdk || {});
  return handler(changes);
}

export const checkAvailables = (ps: PlaySudoku|undefined) => {
  if (!ps) return;
  // aaplica le regole base del sudoku
  applySudokuRules(ps);
  // for Algorithm OneCellFOrValue
  _forEach(ps.groups || {}, (g) => {
    if (!g) return;
    g.availableOnCells = {};
    g.cells.forEach(c => {
      if (!c.value) {
        c.availables.forEach(av => {
          const avs = `${av}`;
          g.availableOnCells[avs] = g.availableOnCells[avs] || {};
          (g.availableOnCells[avs] || {})[c.id] = true;
        });
      }
    });
  });
  // calcolo dello state, ricerca errori, ricerca coppie
  ps.couples = {};
  ps.state.valuesCount = 0;
  ps.state.error = false;
  ps.state.complete = true;
  _forEach(ps.cells || {}, (c) => {
    if (!!c && !c.value && c.availables.length === 2) {
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
  // percentuale di riempimento calcolata sul numero di valori da inserirre
  ps.state.percent = ((ps.state.valuesCount - ps.state.fixedCount) / (81 - ps.state.fixedCount)) * 100;
}


export const clear = (sdk: PlaySudoku): PlaySudoku => {
  return _onSudoku(sdk, (ps) => {
    _forEach(ps?.cells || {}, (c) => {
      if (!!c) {
        c.value = (c.fixed ? c.value : '');
        if (!c.fixed) c.availables = getAvailables(ps.sudoku?.rank);
      }
    });
    ps.state.complete = false;
    ps.state.error = false;
    ps.state.percent = 0;
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
  if (sdk.options.excludeTryAlgorithm && !_includes(exclude, Algorithms.tryNumber)) exclude.push(Algorithms.tryNumber);
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
      // console.log(`Algorithm "${algorithm.name}" successfully applied`, result);
    }
    return new SolveStepResult(ps, result);
  });
}

export const buildDifficultyMap = (algs: AlgorithmResult[]): Dictionary<number> => {
  return _reduce(algs || [], (m, alg) => {
    m[alg.algorithm] = (m[alg.algorithm] || 0) + 1;
    return m;
  }, <Dictionary<number>>{});
}

export const calcDifficultyValue = (diffMap: Dictionary<number>): number => {
  let diff = 0;
  getAlgorithms().forEach(a => {
    const cycles = diffMap[a.id] || 0;
    const factor = ALGORITHMS_FACTORS[a.id] || '';
    const sign = factor[0] || '+';
    const increment = parseFloat(factor.substring(1));
    if (cycles > 0) {
      switch (sign) {
        case '+':
          diff = diff + (increment * cycles);
          break;
        case 'x':
          for (let i = 0; i < cycles; i++) {
            diff = (diff || 1) * parseFloat(factor.substring(1));
          }
          break;
      }
    }
  })
  return Math.floor(diff);
}

export const calcDifficultyLabel = (value: number): string => {
  return DIFFICULTY_RANGES.find(r => r.value > value)?.label || DIFFICULTY_MAX;
}

export const calcDifficulty = (info: SudokuInfo): void => {
  info.difficultyMap = buildDifficultyMap(info.algorithms);
  // console.log('DIFFICULTY MAP:', info.difficultyMap);
  info.difficultyValue = calcDifficultyValue(info.difficultyMap);
  // console.log('DIFFICULTY VAL:', info.difficultyValue);
  info.difficulty = calcDifficultyLabel(info.difficultyValue);
  // console.log('DIFFICULTY LAB:', info.difficulty);
  info.useTryAlgorithm = (info.difficultyMap[TRY_NUMBER_ALGORITHM] || 0) > 0;
  info.compiled = true;
}
