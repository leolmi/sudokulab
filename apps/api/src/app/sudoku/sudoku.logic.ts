import { SudokuDto } from '../../model/sudoku.dto';
import {
  getFixedCount,
  getStandardSchemaName,
  isSchemaString,
  isSudokuObject,
  Sudoku,
  SudokuEx,
  SudokuInfo
} from '@olmi/model';
import { cloneDeep as _clone, isString as _isString, keys as _keys } from 'lodash';
import { getSolution, solve } from '@olmi/logic';

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

const _solve = (sdk: Sudoku): SudokuEx => {
  const work = solve(sdk, { useTryAlgorithm: true });
  return getSolution(work);
}

export const getSudoku = async (s: any): Promise<SudokuEx|undefined> => {
  return new Promise<SudokuEx|undefined>((res, rej) => {
    if (_isString(s)) {
      if (!isSchemaString(s)) return Promise.reject(`incompatible string "${s}"`);
      const sdk = _solve(new Sudoku({ values: `${s}` }));
      res(sdk);
    } else if (isSudokuObject(s)) {
      const sdk = _solve(new Sudoku(s));
      res(sdk);
    } else {
      console.warn('cannot determine schema type for', s);
      res(undefined);
    }
  });
}

export const getAcquireOperations = async (ss: any[]): Promise<any[]> => {
  const operations: any[] = [];
  for (const s of ss) {
    const sdk = await getSudoku(s);
    if (sdk) {
      operations.push(<any>{
        updateOne: {
          filter: { _id: sdk._id },
          update: sdk,
          upsert: true
        }
      })
    } else {
      console.warn('cannot create sudoku', s);
    }
  }
  return operations;
}
