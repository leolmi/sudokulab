import {
  Algorithm,
  AlgorithmResult,
  AlgorithmType,
  Dictionary,
  Difficulty,
  DIFFICULTY_MAX,
  DIFFICULTY_RANGES,
  DIFFICULTY_UNRATED,
  getStat,
  SudokuCell,
  SudokuStat,
  TRY_NUMBER_ALGORITHM
} from '@olmi/model';
import { getAlgorithm } from '@olmi/algorithms';
import { isNumber as _isNumber, keys as _keys, reduce as _reduce, values as _values } from 'lodash';

export const getTryAlgorithmCount = (seq?: AlgorithmResult[]): number => {
  return (seq||[]).filter(i => i.algorithm === TRY_NUMBER_ALGORITHM).length;
}

/**
 * Calcola l'incremento della difficoltà
 * @param v     valore della difficoltà provvisorio
 * @param N     numero di valori considerati
 * @param stat  info dello schema
 * @param f     fattore incrementante (come porzione d'espressione)
 */
const _calcIncrement = (v: number, N: number, stat: SudokuStat, f: string): number => {
  // conta i numeri che completano lo schema
  const nums = ((stat.rank * stat.rank) || 81) - stat.fixedCount;
  // scope dell'espressione
  const scope = {
    N,                    // numero di valori considerati (posizione del ciclo)
    NU: nums,             // numeri necessari al riempimento
    NE: nums-N,           // numeri mancanti al riempimento
    NEP: (nums-N)/nums,   // percentuale di numeri mancanti al riempimento
    NP: N/nums            // percentuale di numeri inseriti
  };
  const exp = `return ${v}${f};`;
  try {
    const c = new Function(_keys(scope).join(','), exp);
    const res = c.apply(c, _values(scope));
    // console.log('INCREMENT', exp, '=', res, scope);
    return _isNumber(res) ? res : v;
  } catch (err) {
    console.error('Error while calc increment', exp, '\n\tscope', scope);
    return v;
  }
}

/**
 * identificativo che tiene conto dell'algoritmo e delle celle su cui è stato
 * determinato (non quelle su cui ha effetto)
 * @param a
 * @param alg
 */
const _getAlgApplicationId = (a: AlgorithmResult, alg: Algorithm): string => {
  const gids = (a.highlights.groups||[]).map(g => g.id).join('-');
  const cids = _keys(a.highlights.secondaryCell).join('-');
  const aids = (alg.type === AlgorithmType.solver) ? _keys(a.highlights.cell).join('-') : '';
  return `${a.algorithm}@${gids}@${cids}@${aids}`
}

/**
 * calcola la difficoltà sugli N step di risoluzione
 * @param seq
 * @param cells
 */
const _calcDifficultyValue = (seq?: AlgorithmResult[], cells?: SudokuCell[]): number => {
  const stat = getStat(cells||[]);
  let diff = 0;
  let N = 0;
  const algCache: any = {};
  (seq||[]).forEach((a, index) => {
    const alg = getAlgorithm(a.algorithm);
    if (alg) {
      if (alg.type === AlgorithmType.solver) N++;
      const appId = _getAlgApplicationId(a, alg);
      // l'applicazione di un algoritmo già trovata ha un incremento minimo
      if (algCache[appId]) {
        diff++;
      } else {
        algCache[appId] = true;
        diff = _calcIncrement(diff, N, stat, alg.factor);
      }
    }
  });
  return Math.floor(diff);
}

const _calcDifficultyMap = (seq?: AlgorithmResult[]): Dictionary<number[]> => {
  return _reduce(seq || [], (m, alg, i) => {
    m[alg.algorithm] = m[alg.algorithm] || [];
    (m[alg.algorithm]||[]).push(i);
    return m;
  }, <Dictionary<number[]>>{});
}

const _calcDifficultyLabel = (value: number): string => {
  if (value<=0) return DIFFICULTY_UNRATED;
  return DIFFICULTY_RANGES.find(r => r.value > value)?.label || DIFFICULTY_MAX;
}

/**
 * calcola i valori della difficoltà dello schema
 * @param seq
 * @param cells
 */
export const calcDifficulty = (seq?: AlgorithmResult[], cells?: SudokuCell[]): Difficulty => {
  const difficultyValue = _calcDifficultyValue(seq, cells);
  const tryAlgorithmCount = getTryAlgorithmCount(seq);

  return new Difficulty({
    difficultyMap: _calcDifficultyMap(seq),
    difficultyValue,
    difficulty: _calcDifficultyLabel(difficultyValue),
    tryAlgorithmCount
  })
}
