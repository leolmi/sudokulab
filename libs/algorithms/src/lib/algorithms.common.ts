import {
  Algorithm,
  AlgorithmResult,
  AlgorithmResultLine,
  buildHighlights,
  CellTypeBy,
  checkStatus,
  Condition,
  decodeCellId,
  findGroup,
  getByVisibles,
  getCell,
  getCellGroups,
  getStat,
  GroupType,
  Highlights,
  isOnGroup,
  isTheSameGroup,
  onValuesMap,
  SudokuCell,
  SudokuGroup
} from '@olmi/model';
import {
  cloneDeep as _clone,
  intersection as _intersection,
  isString as _isString,
  reduce as _reduce,
  remove as _remove,
  uniq as _uniq
} from 'lodash';

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

export const getOrtogonalType = (type: GroupType) => (type === GroupType.row) ? GroupType.column : GroupType.row;

export interface CouplesInfos {
  /**
   * gruppo che contiene la coppia
   */
  group: SudokuGroup;
  /**
   * tutte (9) celle del gruppo che contiene la coppia
   */
  gcells: SudokuCell[];
  /**
   * identificativi delle celle della coppia
   */
  ids: string[];
  /**
   * valore comune della coppia
   */
  value: string;
}

/**
 * esegue l'handler sulle coppie di valori possibili nei gruppi colonne e righe
 * (in ogni cella della coppia restituita possono essere inseriti solo 2 valori e
 * entrambe le celle possono contenere il valore CouplesInfos.value)
 * @param res
 * @param cells
 * @param handler
 * @param validator
 */
export const onCouples = (res: AlgorithmResult,
                          cells: SudokuCell[],
                          handler: (i: CouplesInfos) => boolean,
                          validator?: (i: CouplesInfos) => boolean) => {
  findGroup(cells, (gcells, group) => {
    if (group.type === GroupType.column || group.type === GroupType.row) {
      return onValuesMap(gcells, (value, ids) => {
        const info = <CouplesInfos>{ group, gcells, ids, value  };
        // se nel gruppo solo due celle possono contenere il valore `value`...
        return (ids.length === 2 && (!validator || validator(info))) ? handler(info) : res.applied;
      });
    }
    return res.applied;
  })
}

/**
 * restituisce gli altri valori (diversi da value) che la coppia
 * di celle può contenere
 * @param cells
 * @param value
 */
export const getOthers = (cells: SudokuCell[], value: string) => {
  const values = [...cells[0].available, ...cells[1].available];
  _remove(values, v => v === value);
  return _uniq(values);
}

/**
 * esegue il gestore su ogni gruppo che contiene la cella escluso quello indicato (se presente)
 * @param cells
 * @param cid
 * @param xgid
 * @param handler
 */
export const onCellGroups = (cells: SudokuCell[], cid: string, xgid: string|undefined, handler: (g: SudokuGroup) => boolean) => {
  const cell = getCell(cells, cid);
  getCellGroups(cell)
    .filter(g => g.id !== (xgid||''))
    .find(g => handler(g));
}

export const oneIsOrtogonal = (ids1: string[], ids2: string[], gtype: GroupType): boolean => {
  const otype = getOrtogonalType(gtype);
  const cval = CellTypeBy[otype];
  return !!ids1.find(id1 => {
    const cell1 = decodeCellId(id1);
    return !!ids2.find(id2 => {
      const cell2 = decodeCellId(id2);
      return !!cval && (<any>cell2)[cval] === (<any>cell1)[cval];
    })
  })
}

export const isTheSameValueTypeOnGroups = (i1: CouplesInfos, i2: CouplesInfos): boolean =>
  !isTheSameGroup(i1.group, i2.group) && i1.group.type === i2.group.type && i1.value === i2.value && oneIsOrtogonal(i1.ids, i2.ids, i1.group.type);

/**
 * vero se la cella contiene N valori possibili
 * @param c
 * @param N (default = 2)
 */
export const hasNAvailable = (c: SudokuCell|undefined, N = 2): boolean =>
  !c?.text && (c?.available||[]).length === N;

/**
 * valuta ogni incrocio tra le celle coppie di i1 e i2 e se trova valori uguali diversi da quello di coppia
 * esegue l'hander su ogni cella esterna ai gruppi che può vederle entrambe
 * @param res
 * @param cells
 * @param i1
 * @param i2
 * @param handler
 */
export const onOthers = (res: AlgorithmResult,
                         cells: SudokuCell[],
                         i1: CouplesInfos,
                         i2: CouplesInfos,
                         handler: (oc: SudokuCell, v: string) => void) => {
  i1.ids.forEach(cid1 => {
    const c1 = getCell(cells, cid1);
    i2.ids.find(cid2 => {
      const c2 = getCell(cells, cid2);
      if (hasNAvailable(c1) && hasNAvailable(c2)) {
        const int = _intersection(c1?.available || [], c2?.available || []);
        _remove(int, v => v === i1.value);
        if (int.length > 0) {
          const value = int[0];
          // const cids = [...i1.ids, ...i2.ids];
          getByVisibles(cells, [cid1, cid2])
            // .filter(oc => !cids.includes(oc.id))
            .forEach(oc => {
              // se la cella non appartiene a nessuno dei due gruppi e contiene
              // il possibile valore comune alla coppia
              if (oc.available.includes(value) && !isOnGroup(oc, i1.group) && !isOnGroup(oc, i2.group)) handler(oc, value);
            });
        }
      }
      return res.applied;
    });
  });
}
