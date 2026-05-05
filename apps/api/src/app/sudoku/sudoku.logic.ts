import { SudokuDto } from '../../model/sudoku.dto';
import {
  canonize,
  getFixedCount,
  getStandardSchemaName,
  isSchemaString,
  isSudokuObject,
  SDK_PREFIX,
  Sudoku,
  SudokuEx,
  SudokuInfo
} from '@olmi/model';
import { cloneDeep as _clone, isString as _isString, keys as _keys } from 'lodash';
import { countSolutions, getSolution, getWorkStat, solve } from '@olmi/logic';
import { environment } from '../../environments/environment';

export const validate = (sdk: SudokuDto): string => {
  if ((sdk?._id||'') === '') return `wrong identity`;
  if ((sdk?.values||'') === '') return `empty fixed string`;
  // check logics...

  return null;
}

const translate0 = (old: any[]): Sudoku[] => {
  return old.map((os: any) => {
    const values = <string>os.fixed;
    const diffMap = <any>os.info?.difficultyMap||{};
    const info = new SudokuInfo({
      rank: 9,
      difficulty: os.info?.difficulty||'',
      fixedCount: getFixedCount(values),
      symmetry: os.info?.symmetry||'',
      useTryAlgorithm: !!os.info?.useTryAlgorithm,
      unique: !!os.info?.unique,
      difficultyValue: parseInt(`${os.info?.difficultyValue||''}`, 10),
      tryAlgorithmCount: (diffMap['TryNumber']||[]).length,
      difficultyMap: _clone(diffMap),
      algorithmCount: _keys(diffMap).length
    });
    const sdk = new Sudoku({ values, info });
    sdk.name = getStandardSchemaName(sdk);
    return sdk;
  });
}

/**
 * attualizza l'elenco di schemi'
 * @param ss
 */
export const translate = (ss: any[]): Sudoku[] => {
  // dovrebbe verificare la versione degli schemi forniti
  const version = ss[0]?.info?.version || '0';
  switch (version) {
    case '0':
      return translate0(ss);
    default: {
      const sds = ss.filter(s => isSudokuObject(s));
      if (sds.length < ss.length) console.warn('not all schemas will be translated');
      return sds.map(s => new Sudoku(s));
    }
  }
}

const _solve = (sdk: Sudoku): { sol: SudokuEx|undefined, reason?: string } => {
  const work = solve(sdk, { useTryAlgorithm: true, debug: environment.debug });
  const stat = getWorkStat(work);
  const sol = stat.isUniqueSuccess ? getSolution(work) : undefined;
  if (sol) return { sol };
  let reason: string;
  if (stat.isSuccess && !stat.unique) {
    const n = (work.solutions || []).filter(s => s.status === 'success').length;
    reason = `not unique (${n} solutions)`;
  } else if (stat.isOutOfRange) {
    reason = 'out of range';
  } else {
    reason = stat.error || 'unsolved';
  }
  return { sol: undefined, reason };
}

/**
 * verdetto del solver catalogato: numero di rami success e status sintetico
 * (utile per confrontare il motore con il brute-force indipendente)
 */
export const getCatalogVerdict = (values: string): { count: number; status: string } => {
  const sdk = new Sudoku({ values });
  const work = solve(sdk, { useTryAlgorithm: true });
  const stat = getWorkStat(work);
  const count = (work.solutions || []).filter(s => s.status === 'success').length;
  const status = stat.isOutOfRange ? 'out of range'
    : stat.isUniqueSuccess ? 'unique'
    : stat.isSuccess ? `not unique (${count})`
    : stat.error || 'unsolved';
  return { count, status };
}

export const getSudoku = async (s: any): Promise<SudokuEx|undefined> => {
  return new Promise<SudokuEx|undefined>((res, rej) => {
    if (_isString(s)) {
      if (!isSchemaString(s)) return Promise.reject(`incompatible string "${s}"`);
      const { sol, reason } = _solve(new Sudoku({ values: `${s}` }));
      if (!sol) console.warn(`cannot solve schema "${s}": ${reason}`);
      res(sol);
    } else if (isSudokuObject(s)) {
      const { sol, reason } = _solve(new Sudoku(s));
      if (!sol) console.warn(`cannot solve schema "${s?.values||s?._id||'?'}": ${reason}`);
      res(sol);
    } else {
      console.warn('cannot determine schema type for', s);
      res(undefined);
    }
  });
}

/**
 * estrae la stringa di 81 caratteri da un input grezzo (stringa o oggetto Sudoku)
 */
const getSchemaValues = (s: any): string => {
  if (_isString(s)) return s;
  if (isSudokuObject(s)) return `${s?.values || ''}`;
  return '';
}

/**
 * produce le operazioni di upsert per gli schemi validi.
 *
 * Applica gli stessi criteri di validazione di `SudokuService._check`:
 *  - brute-force (`countSolutions`) → scarta `invalid` (count=0) e `not-unique` (count≥2)
 *  - motore catalogato (`getSudoku`) → scarta i casi di `disagreement` (brute dice 1
 *    ma il motore catalogato non riesce a risolvere)
 *
 * Così il salvataggio viene annullato (lo schema non entra nelle operazioni di bulk)
 * se non risponde alle regole di validazione usate dal flusso `/sudoku/check`.
 */
export const getAcquireOperations = async (ss: any[]): Promise<any[]> => {
  const operations: any[] = [];
  for (const s of ss) {
    const values = getSchemaValues(s);
    if (!values) {
      console.warn(...SDK_PREFIX, '[acquire] schema ignorato: input non riconosciuto', s);
      continue;
    }
    const bruteCount = countSolutions(values, 2);
    if (bruteCount === 0) {
      console.warn(...SDK_PREFIX, `[acquire] schema "${values}" è incoerente (nessuna soluzione) — non persistito`);
      continue;
    }
    if (bruteCount >= 2) {
      console.warn(...SDK_PREFIX, `[acquire] schema "${values}" non è a soluzione unica (trovate almeno ${bruteCount}) — non persistito`);
      continue;
    }
    const sdk = await getSudoku(s);
    if (!sdk) {
      console.error(...SDK_PREFIX, `[acquire] schema "${values}" univoco al brute-force ma non risolto dal motore catalogato (disagreement) — non persistito`);
      continue;
    }
    // popola i campi canonical: bulkWrite salta i middleware Mongoose, va fatto qui
    if (sdk.values && !sdk.info.canonicalId) {
      const { canonical, token } = canonize(sdk.values);
      sdk.info.canonicalId = canonical;
      sdk.info.canonicalToken = `${token.t}:${token.relabel}`;
    }
    operations.push(<any>{
      updateOne: {
        filter: { _id: sdk._id },
        update: sdk,
        upsert: true
      }
    });
  }
  return operations;
}
