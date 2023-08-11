import {PlaySudoku} from '../PlaySudoku';
import {AlgorithmResult} from '../AlgorithmResult';
import {SolveStepResult} from './SolveStepResult';
import {
  applySudokuRules,
  getAlgorithmsMap,
  getAvailables,
  getGroups,
  getRank,
  getValues,
  isSolved
} from '../../sudoku.helper';
import {
  cloneDeep as _clone,
  extend as _extend,
  forEach as _forEach,
  includes as _includes,
  isNumber as _isNumber,
  keys as _keys,
  reduce as _reduce,
  values as _values
} from 'lodash';
import {Dictionary} from '@ngrx/entity';
import {SolveAllResult} from './SolveAllResult';
import {SudokuSolution} from '../SudokuSolution';
import {SudokuInfo} from '../SudokuInfo';
import {DIFFICULTY_MAX, DIFFICULTY_RANGES, getAlgorithm, getAlgorithms, TRY_NUMBER_ALGORITHM} from '../Algorithms';
import {Algorithms, AlgorithmType} from '../enums';
import {PlaySudokuGroup} from '../PlaySudokuGroup';
import {addLine, debug, isValue} from '../../global.helper';
import {SDK_PREFIX, SDK_PREFIX_DEBUG} from '../consts';
import {PlaySudokuCell} from "../PlaySudokuCell";

export class Solver {
  private readonly _sdks: SudokuSolution[];

  constructor(sdk: PlaySudoku) {
    const csdk = clear(sdk);
    this._sdks = [new SudokuSolution(csdk)];
  }

  private _solveOne(sol: SudokuSolution) {
    const result = solveStep(sol.sdk);
    if (!!result?.sdk) {
      _extend(sol.sdk, result.sdk);
      if (!!result.result) {
        sol.algorithms.push(result.result);
        if ((result.result.cases || []).length > 0) {
          this._sdks.push(...result.result.cases.map(ps => _getCaseSolution(ps, sol)));
        }
      }
    } else {
      sol.sdk.state.error = addLine(sol.sdk.state.error, 'No algorithm could be applied!');
    }
  }

  private _solveParallel(): SolveAllResult {
    const start = Date.now();
    let reason = '';
    do {
      this._sdks.forEach(sol => {
        if (_canSolveOne(sol.sdk)) {
          this._solveOne(sol);
        }
      });
      reason = _cannotSolve(this._sdks);
    } while (!reason);
    return new SolveAllResult(this._sdks, start, reason);
  }

  private _solveSerial(): SolveAllResult {
    const start = Date.now();
    const maxsplit = this._sdks[0].sdk.options.maxSplitSchema;
    let reason = '';
    do {
      if (this._sdks.length > maxsplit) {
        reason = `Exceeded the limit of the maximum number of splits (${maxsplit})`;
      } else if (_notUnique(this._sdks)) {
        reason = `Multiple solutions found!`;
      } else {
        const sol = _firstSolvable(this._sdks);
        if (!sol) {
          reason = 'No solvable schema!';
        } else {
          this._solveOne(sol);
        }
      }
    } while (!reason)
    return new SolveAllResult(this._sdks, start, reason);
  }

  solve(): SolveAllResult {
    // return this._solveParallel();
    if ((this._sdks||[]).length<1) return new SolveAllResult([], new Date().getTime(),'no available schema');
    if (!isSolvable(this._sdks[0].sdk)) return new SolveAllResult([], new Date().getTime(),'no solvable schema');
    return this._solveSerial();
  }

  check(): string {
    const schema = this._sdks[0]?.sdk?.sudoku;
    if (!schema) return 'Undefined schema';
    if (this._sdks[0]?.sdk.state.fixedCount<11) return 'Too few fixed number to try solve it!';
    return '';
  }
}

/**
 * Verifica che lo schema sia risolvibile
 * @param sdk
 */
export const isSolvable = (sdk: PlaySudoku): boolean => {
  validateValues(sdk);
  return _canSolveOne(sdk);
}

/**
 * verifica che non ci siano più di uno schema risolto
 * @param sdks
 */
const _notUnique = (sdks: SudokuSolution[]): boolean => {
  let counter = 0;
  return !!sdks.find(sol => {
    if (isSolved(sol.sdk)) counter++;
    return counter > 1;
  })
}

const _firstSolvable = (sdks: SudokuSolution[]) => {
  return (sdks || []).find(sol => _canSolveOne(sol.sdk));
}

const _getCaseSolution = (ps: PlaySudoku, sol: SudokuSolution): SudokuSolution => {
  const ss = new SudokuSolution(ps);
  ss.algorithms = _clone(sol.algorithms);
  return ss;
}

const _canSolveOne = (sdk: PlaySudoku): boolean => {
  return !sdk.state.error && !sdk.state.complete;
};

const _canSolve = (sdks: SudokuSolution[]): boolean => {
  return (sdks || []).length < sdks[0].sdk.options.maxSplitSchema &&
    !!(sdks || []).find(sol => _canSolveOne(sol.sdk));
};

const _cannotSolve = (sdks: SudokuSolution[]): string => {
  const maxsplit = sdks[0].sdk.options.maxSplitSchema;
  if ((sdks || []).length > maxsplit)
    return `Exceeded the limit of the maximum number of splits (${maxsplit})`;
  const solvable = (sdks || []).find(sol => _canSolveOne(sol.sdk));
  return solvable ? '' : `No solvable schema`;
};

const _onSudoku = <T>(sdk: PlaySudoku, handler: (sdk: PlaySudoku) => T) => {
  const changes: PlaySudoku = <PlaySudoku>_clone(sdk || {});
  return handler(changes);
}

/**
 * restituisce vero se il gruppo contiene più celle oltre la passata con il suo valore
 * @param g
 * @param c
 */
const hasMoreValues = (g: PlaySudokuGroup, c: PlaySudokuCell): boolean => {
  return (g.valuesOnCells[c.id]||0) > 1;
}

export const checkAvailables = (sdk: PlaySudoku|undefined, resetBefore = false) => {
  if (!sdk) return;
  // aaplica le regole base del sudoku
  applySudokuRules(sdk, resetBefore);
  // reset dei valori
  sdk.state.valuesCount = 0;
  sdk.state.error = '';
  sdk.state.complete = true;
  // calcolo degli availableOnCells mappa utile all'algoritmo OneCellForValue
  _forEach(sdk.groups || {}, (g) => {
    if (!g) return;
    g.availableOnCells = {};
    g.cells.forEach(cid => {
      if (!sdk.cells[cid]?.value) {
        sdk.cells[cid]?.availables.forEach(av => {
          const avs = `${av}`;
          g.availableOnCells[avs] = g.availableOnCells[avs] || {};
          (g.availableOnCells[avs] || {})[cid] = true;
        });
      }
    });
  });
  // calcolo dello state e ricerca errori
  _forEach(sdk.cells || {}, (c) => {
    if (!!c?.value) sdk.state.valuesCount++;
    if (!!c && !c.fixed) {
      const cgs = getGroups(sdk, [c.id]);
      const morev = cgs.find(g => hasMoreValues(g, c));
      c.error = isValue(c.value) && (!_includes(c.availables, c.value) || !!morev);
      if (!!c.error) sdk.state.error = addLine(sdk.state.error, `Any available value for the cell "${c.id}"!`);
      if (!c.value) sdk.state.complete = false;
    }
  });
  // percentuale di riempimento calcolata sul numero di valori da inserirre
  sdk.state.percent = ((sdk.state.valuesCount - sdk.state.fixedCount) / (81 - sdk.state.fixedCount)) * 100;
}

/**
 * Verifica il valore
 * @param sdk
 * @param v
 * @param useX
 */
export const isRightValue = (sdk: PlaySudoku|undefined, v: string, useX = false): boolean => {
  if (!sdk) return false;
  if (v === 'x') return useX;
  const nValue = parseInt(v, 10);
  const rank = getRank(sdk);
  return (nValue >= 0 && nValue <= rank);
}

/**
 * Verifica i valori presenti
 * @param sdk
 */
export const validateValues = (sdk: PlaySudoku|undefined) => {
  if (!sdk) return;
  //verifica per ogni gruppo la presenza di valori coerenti
  _forEach(sdk.groups || {}, (g) => {
    if (!g) return;
    const gc: Dictionary<number> = {};
    g.cells.forEach(cid => {
      const value = sdk.cells[cid]?.value;
      if (value) {
        const key = `${value}`;
        gc[key] = (gc[key] || 0) + 1;
        if (!isRightValue(sdk, key)) pushError(sdk, `Group ${g.id} has a wrong value "${key}"`);
      }
    });
    if (_values(gc).find(v => (v || 0) > 1)) pushError(sdk, `Group ${g.id} has some wrong values`);
  });
}

export const pushError = (sdk: PlaySudoku|undefined, error: string) => {
  if (!sdk || !error) return;
  sdk.state.error = `${sdk.state.error ? `${sdk.state.error}\n` : ''}${error}`;
}

/**
 * Restituisce un dictionary con i valori a cui sono associate le coppie di celle che li possono ospitare
 * { 2: ['0.1', '0.5'], 6: ['0.3', '0.5'] }
 * @param g
 * @param handler
 */
export const getGroupCouples = (g: PlaySudokuGroup|undefined, handler?: (ids: string[]) => boolean): Dictionary<string[]> => {
  return _reduce(g?.availableOnCells || {}, (res, cids, av) => {
    const ids = _keys(cids || {});
    if (ids.length === 2 && ((!handler || handler(ids)))) res[av] = ids;
    return res;
  }, <Dictionary<string[]>>{});
}

/**
 * Restituisce un dictionary con i valori a cui sono associate le coppie di celle che li possono ospitare
 * @param sdk
 * @param g
 */
export const getGroupExplicitCouples = (sdk: PlaySudoku, g: PlaySudokuGroup|undefined): Dictionary<string[]> => {
  const res: Dictionary<string[]> = {};
  // contiene
  // { 'x,y': [ cellid1, cellid2 ] }
  const cvmap: any = {};
  (g?.cells || []).forEach(id => {
    const cell = sdk.cells[id];
    if (!cell?.fixed && (cell?.availables || []).length === 2) {
      const k = cell?.availables.join(',') || '';
      cvmap[k] = cvmap[k] || [];
      cvmap[k].push(cell?.id);
    }
  });
  // aggiunge al risultato
  _forEach(cvmap, (ids, v) =>
    (ids.length === 2) ? res[ids.join('|')] = v.split(',') : null);
  return res;
}

export const clear = (sdk: PlaySudoku): PlaySudoku => {
  return _onSudoku(sdk, (ps) => {
    if (ps.options.usePencil) {
      _forEach(ps?.cells || {}, (c) => {
        if (c) c.pencil = [];
      });
    } else {
      _forEach(ps?.cells || {}, (c) => {
        if (!!c) {
          c.value = (c.fixed ? c.value : '');
          if (!c.fixed) c.availables = getAvailables(ps.sudoku?.rank);
        }
      });
      ps.state.complete = false;
      ps.state.error = '';
      ps.state.percent = 0;
      checkAvailables(ps);
    }
    return ps;
  });
}

export const applyAlgorithm = (sdk: PlaySudoku, aname: string): PlaySudoku|undefined => {
  return _onSudoku(sdk, (ps) => {
    const alg = getAlgorithm(aname);
    if (!alg) {
      debug(() => console.warn(...SDK_PREFIX_DEBUG, `Algorithm "${aname}" not found!`));
      return;
    }
    const result = alg.apply(ps);
    if (!result.applied) return;
    return ps;
  });
}

/**
 * Utilizzata per la risoluzione step to step
 * @param sdk
 * @param exclude
 */
export const solveStepToCell = (sdk: PlaySudoku|undefined, exclude: string[] = []): SolveStepResult[] => {
  let cycles = 0;
  const infos: SolveStepResult[] = [];
  let res: SolveStepResult | undefined;
  // il ciclo continua fintanto che l'applicazione di un algoritmo
  // ha successo ma non aggiunge valori nuovi
  // quindi termina quando non trova alcun algoritmo da applicare
  do {
    res = solveStep(sdk, exclude);
    debug(() => console.log(...SDK_PREFIX_DEBUG, `cycle n°${(cycles+1)} result:`, res));
    if (!!res?.sdk) sdk = res.sdk;
    if (res) infos.push(res);
    cycles++;
  } while (!!res && cycles < 10 && _keys(res?.result?.cells || []).length <= 0);
  return infos;
}

/**
 * singolo step di risoluzione
 * - se un algoritmo è stato applicato con successo restituisce un result.applied = true
 * @param sdk
 * @param exclude
 */
export const solveStep = (sdk: PlaySudoku|undefined, exclude: string[] = []): SolveStepResult|undefined => {
  if (sdk?.state.error) {
    debug(() => console.warn(...SDK_PREFIX_DEBUG, 'No algorithm can be applied!'));
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
      debug(() => console.warn(...SDK_PREFIX_DEBUG, 'No algorithm has been applied!'));
      return;
    } else {
      if (ps.sudoku) ps.sudoku.values = getValues(ps);
      debug(() => console.log(...SDK_PREFIX_DEBUG, `Algorithm "${algorithm.name}" successfully applied`, result));
    }
    return new SolveStepResult(ps, result);
  });
}
/**
 * Mappa degli algoritmi utilizzati per step
 * {
 *   alg-1: [1,4,...],
 *   alg-2: [2,3,...]
 *   ...
 * }
 * @param algs
 */
export const buildDifficultyMap = (algs: AlgorithmResult[]): Dictionary<number[]> => {
  return _reduce(algs || [], (m, alg, i) => {
    m[alg.algorithm] = m[alg.algorithm] || [];
    (m[alg.algorithm]||[]).push(i);
    return m;
  }, <Dictionary<number[]>>{});
}

/**
 * Calcola l'incremento della difficoltà
 * @param v     valore della difficoltà provvisorio
 * @param N     numero di valori considerati
 * @param rank  rank dello schema
 * @param fxC   numero di valori fissi
 * @param f     fattore incrementante (come porzione d'espressione)
 */
const calcIncrement = (v: number, N: number, rank: number, fxC: number, f: string): number => {
  // conta i numeri che completano lo schema
  const nums = ((rank * rank) || 81) - fxC;
  // scope dell'espressione
  const scope = {
    N,                    // numero di valori considerati (posizione del ciclo)
    NU: nums,             // numeri necessari al riempimento
    NE: nums-N,           // numeri mancanti al riempimento
    NEP: (nums-N)/nums,   // percentuale di numeri mancanti al riempimento
    NP: N/nums            // percentuale di numeri inseriti
  };
  const exp = `return ${v} ${f};`;
  try {
    const c = new Function(_keys(scope).join(','), exp);
    const res = c.apply(c, _values(scope));
    debug(() => console.log('INCREMENT', exp, '=', res, scope));
    return _isNumber(res) ? res : v;
  } catch (err) {
    console.error('Error while calc increment', exp, '\n\tscope', scope);
    return v;
  }
}

/**
 * Calcola il valore della difficoltà
 * @param info
 */
export const calcDifficultyValue = (info: SudokuInfo): number => {
  let diff = 0;
  let N = 0;
  const algorithms = getAlgorithmsMap();
  info.algorithms.forEach(a => {
    const alg = algorithms[a.algorithm];
    if (!!alg) {
      if (alg.type === AlgorithmType.solver) N++;
      diff = calcIncrement(diff, N, info.rank, info.fixedCount, alg.factor);
    }
  });
  return Math.floor(diff);
}

export const calcDifficultyLabel = (value: number): string => {
  return DIFFICULTY_RANGES.find(r => r.value > value)?.label || DIFFICULTY_MAX;
}

export const calcDifficulty = (info: SudokuInfo): void => {
  info.difficultyMap = buildDifficultyMap(info.algorithms);
  info.difficultyValue = calcDifficultyValue(info);
  info.difficulty = calcDifficultyLabel(info.difficultyValue);
  info.useTryAlgorithm = (info.difficultyMap[TRY_NUMBER_ALGORITHM] || []).length > 0;
  info.compiled = true;
  debug(() => console.log(...SDK_PREFIX, 'difficulty calculated', info));
}
