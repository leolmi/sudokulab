import {
  AllGroupTypes,
  Cell,
  Couple,
  DEFAULT_RANK,
  DEFAULT_TOTAL_RANK,
  DIFFICULTY_MIN,
  DIFFICULTY_VALUES,
  GroupType,
  GroupTypeMap,
  SDK_PREFIX,
  STANDARD_CHARACTERS,
  Sudoku,
  SUDOKU_MIN_FIXED_CELLS,
  SudokuCell,
  SudokuEx,
  SudokuGroup,
  SudokuInfo,
  SudokuInfoEx,
  SudokuStat,
  UserValue,
  ValueOptions,
  ValuesMap
} from './lib';
import {
  forOwn,
  intersection as _intersection,
  isArray as _isArray,
  isEqual as _isEqual,
  isNumber as _isNumber,
  isObject as _isObject,
  isString as _isString,
  keys as _keys,
  padEnd as _padEnd,
  random as _random,
  reduce as _reduce,
  repeat as _repeat,
  uniqBy as _uniqBy
} from 'lodash';
import { getHash } from './generic.helper';


/**
 * id cella = "col:row"
 * @param col
 * @param row
 */
export const cellId = (col: number|Cell, row?: number) => {
  return _isNumber(col) ? `${<number>col||0}:${row||0}` : getCellId(<Cell>col);
}

/**
 * id gruppo = "type:pos"
 * @param type
 * @param pos
 */
export const groupId = (type: GroupType, pos: number) => `${type}.${pos}`;

/**
 * restituisce la coordinata utente del gruppo
 * @param group
 */
export const getGroupPos = (group?: SudokuGroup) => {
  switch (group?.type) {
    case GroupType.row: return 'ABCDEFGHI'.charAt(group?.pos||0);
    default: return group ? `${(group.pos+1)}` : '';
  }
}

/**
 * coordinata della cella (es: "A1")
 * @param cell
 */
export const cellCoord = (cell?: Cell) => cell ? `${'ABCDEFGHI'.charAt(cell.row)}${cell.col+1}` : '';

/**
 * coordinata del gruppo (es: "rowB")
 * @param group
 */
export const groupCoord = (group?: SudokuGroup) => group ? `${group.type}${getGroupPos(group)}` : '';

/**
 * id cella
 * @param cell
 */
export const getCellId = (cell?: Cell) => {
  return `${cell?.col||0}:${cell?.row||0}`;
}

/**
 * restituisce l'indice della cella nella stringa dello schema
 * @param cell
 */
export const getCellIndex = (cell: Cell): number =>
  cell.row*DEFAULT_RANK + cell.col;

/**
 * restituisce le coordinate della cella. Valori accettati:
 * - id cella;
 * - oggetto Cell
 * @param c
 */
export const getCoord = (c: string|Cell|undefined): string => {
  if (_isString(c)) c = decodeCellId(`${c}`);
  return c ? cellCoord(<Cell>c) : '';
}

/**
 * decifra le coordinate della cella
 * @param id
 */
export const decodeCellId = (id: string): Cell|undefined => {
  const values = (id || '').split(':');
  if (values.length > 1) return <Cell>{
    col: parseInt(values[0], 10),
    row: parseInt(values[1], 10)
  };
  const m = /([a-zA-Z])(\d)|(\d)([a-zA-Z])/g.exec(id);
  if (m) {
    const rows = 'abcdefghi';
    if (m[1]) {
      return <Cell>{
        row: rows.indexOf((m[1] || '').toLowerCase()),
        col: parseInt(m[2], 10) - 1
      };
    } else if (m[3]) {
      return <Cell>{
        row: rows.indexOf((m[4] || '').toLowerCase()),
        col: parseInt(m[3], 10) - 1
      };
    }
  }
  return undefined;
}

export const decodeGroupId = (id: string): SudokuGroup => {
  const values = (id || '').split('.');
  const type = <GroupType>values[0];
  const pos = parseInt(values[1], 10);
  return new SudokuGroup({ type, pos });
}

export const getCell = (cells: SudokuCell[], pos?: Cell|string|undefined|null): SudokuCell|undefined => {
  return _isString(pos) ?
    cells.find(c => c.id === pos || c.coord === pos) :
    cells.find(c => c.row === pos?.row && c.col === pos?.col);
}

/**
 * cicla tutte le celle da sinistra verso destra e dall'alto verso il basso
 * @param handler
 * @param rank
 */
export const forEachCell = (handler: (c: Cell, i: number) => any, rank = DEFAULT_RANK) => {
  for (let row = 0; row < rank; row++) {
    for (let col = 0; col < rank; col++) {
      handler({ col, row }, (row*rank)+col);
    }
  }
}

/**
 * restituisce la posizione del gruppo del tipo specificato di cui la cella fa parte
 * @param cell
 * @param type
 */
export const getCellGroupPos = (cell: Cell|string|undefined, type: GroupType): number => {
  const c: Cell|undefined = _isString(cell) ? decodeCellId(cell) : <Cell>cell;
  if (!c) return -1;
  switch (type) {
    case GroupType.square:
      return ((3 * Math.floor(c.row / 3)) + Math.floor(c.col / 3));
    case GroupType.column:
      return c.col;
    case GroupType.row:
    default:
      return c.row;
  }
}

/**
 * vero se la cella fa parte del gruppo
 * @param cell
 * @param group
 */
export const isOnGroup = (cell: SudokuCell, group: SudokuGroup): boolean => {
  return getCellGroupPos(cell, group.type) === group.pos;
}

/**
 * restituisce le celle appartenenti al gruppo
 * @param cells
 * @param g
 */
export const getGroupCells = (cells: SudokuCell[], g: SudokuGroup): SudokuCell[] => {
  return cells.filter(c => isOnGroup(c, g));
}

/**
 * restituisce i gruppi a cui appartiene la cella
 * @param cell
 */
export const getCellGroups = (cell?: Cell): SudokuGroup[] => {
  return cell ? [
    new SudokuGroup({ type: GroupType.column, pos: cell.col }),
    new SudokuGroup({ type: GroupType.row, pos: cell.row }),
    new SudokuGroup({ type: GroupType.square, pos: getCellGroupPos(cell, GroupType.square) })
  ] : [];
}

/**
 * restituisce la mappa dei valori possibili per cella
 * ````
 * { aN: { cid1:true, ..., cidK: true }, ... }
 * ````
 * dove "aN" è il valore possibile e "cxdY" sono le celle in cui il valore può stare
 * @param cells
 */
export const getCellsAvailableMap = (cells: SudokuCell[]): ValuesMap => {
  return _reduce(cells, (m, c) => {
    if (!c.text) {
      c.available.forEach(a => m[a] = {...m[a], [c.id]: true });
    }
    return m;
  }, <ValuesMap>{});
}


/**
 * vero se la cella è fissa o dinamica
 * @param c
 */
export const isFixedOrDynamic = (c?: SudokuCell): boolean => !!c?.isFixed || !!c?.isDynamic;

/**
 * vero se la cella non ha valore e non è né fissa né dinamica
 * @param c
 */
export const isEmptyCell = (c?: SudokuCell): boolean => !!c && !c.text && !isFixedOrDynamic(c);

/**
 * vero se la cella non ha valore e non è fissa o dinamica
 * @param c
 */
export const isEmptyDynamic = (c?: SudokuCell): boolean => !!c && !c.text && c.isDynamic;


/**
 * vero se individuano la stessa cella
 * @param c1
 * @param c2
 */
export const isTheSameCell = (c1?: SudokuCell, c2?: SudokuCell): boolean => !!c1 && c1.id === c2?.id;

/**
 * vero se individuano lo stesso gruppo
 * @param g1
 * @param g2
 */
export const isTheSameGroup = (g1?: SudokuGroup, g2?: SudokuGroup): boolean => !!g1 && g1?.id === g2?.id;

export const setDynamic = (c: SudokuCell): void => {
  c.isDynamic = true;
  c.text = STANDARD_CHARACTERS.dynamic;
}

/**
 * imposta il valore della cella trasformandola in cella fissa
 * @param c
 * @param value
 */
export const setCellFixedValue = (c: SudokuCell, value: string): void => {
  c.isFixed = true;
  c.text = value;
  c.available = [];
}

/**
 * permette di gestire i valori *v* comuni alle celle *ids*
 * @param cells
 * @param handler
 */
export const onValuesMap = (cells: SudokuCell[], handler: (v: string, ids: string[], vm: ValuesMap) => boolean): boolean => {
  const cmap = getCellsAvailableMap(cells);
  return !!_keys(cmap).find(v => {
    const ids = _keys(cmap[v]);
    return handler(v, ids, cmap);
  });
}

/**
 * permette di gestire tutti i gruppi comuni alle celle passate
 * @param ids
 * @param handler
 */
export const findCommonGroups = (ids: string[], handler: (groups: SudokuGroup[]) => boolean): boolean => {
  const cells = ids.map(id => decodeCellId(id));
  const gg = cells.map(c => getCellGroups(c).map(g => g.id));
  const groups = _intersection(...gg).map(gid => decodeGroupId(gid));
  return (groups.length > 0) ? handler(groups) : false;
}


/**
 * cicla tutti i gruppi dello schema
 * @param cells
 * @param handler
 */
export const forEachGroup = (cells: SudokuCell[], handler: (gcells: SudokuCell[], group: SudokuGroup) => any) => {
  [GroupType.row, GroupType.column, GroupType.square].forEach(type => {
    for (let pos = 0; pos < DEFAULT_RANK; pos++) {
      const group = new SudokuGroup({ pos, type });
      const gcells = getGroupCells(cells, group);
      handler(gcells, group);
    }
  });
}

/**
 * cicla tutti i gruppi dello schema
 * @param cells
 * @param handler
 */
export const findGroup = (cells: SudokuCell[], handler: (gcells: SudokuCell[], group: SudokuGroup) => boolean): SudokuGroup|undefined => {
  for (const type of [GroupType.row, GroupType.column, GroupType.square]) {
    for (let pos = 0; pos < DEFAULT_RANK; pos++) {
      const group = new SudokuGroup({ pos, type });
      const gcells = getGroupCells(cells, group);
      if (handler(gcells, group)) return group;
      // console.log(`iterated: type=${type}, pos=${pos}`);
    }
  }
  return undefined;
}

/**
 * vero se la cella fa parte del gruppo
 * @param g
 * @param cid
 */
export const hasCell = (g: SudokuGroup, cid: string): boolean => {
  const cell = decodeCellId(cid);
  return cell ? getCellGroupPos(cell, g.type) === g.pos : false;
}

/**
 * vero se tutte le celle appartengono al gruppo
 * @param g
 * @param ids
 */
export const hasCells = (g: SudokuGroup, ids: string[]): boolean => !ids.find(id => !hasCell(g, id));

/**
 * Restituisce l'elenco dei gruppi a cui appartengono
 * - (forAll=false) almeno una delle celle passate
 * - (forAll=true) tutte le celle passate
 * @param cells
 * @param ids
 * @param forAll
 */
export const getAllGroups = (cells: SudokuCell[], ids: string[], forAll = false): SudokuGroup[] => {
  const groups: SudokuGroup[] = [];
  ids.forEach(id => {
    const cell = decodeCellId(id);
    const cellGroups = getCellGroups(cell);
    if (forAll) {
      groups.push(...cellGroups.filter(g => hasCells(g, ids)))
    } else {
      groups.push(...cellGroups);
    }
  });
  return _uniqBy(groups, g => g.id);
}


export const hasSameAvailable = (c1: SudokuCell, c2: SudokuCell): boolean => {
  return _isEqual(c1.available, c2.available);
}


/**
 * trova le coppie. Una coppia può essere
 * - solo quella coppia di celle contiene i valori
 * - nella coppia di celle possono stare solo i due valori
 * @param cells
 * @param group
 * @param handler
 */
export const findCouples = (cells: SudokuCell[], group: SudokuGroup, handler: (cpls: Couple[]) => boolean) => {
  const cpls: Couple[] = [];

  // ricerca delle sole celle che contengono entrambe i due valori specifici
  const vmap = getCellsAvailableMap(cells);
  const values = _keys(vmap);
  const v_length = values.length;
  values.forEach((v, i) => {
    const cids = _keys(vmap[v]);
    if (cids.length === 2) {
      for (let j = i + 1; j < v_length; j++) {
        const ov = values[j];
        const ocids = _keys(vmap[ov]);
        if (ocids.length === 2 && _isEqual(cids, ocids)) {
          // trovata coppia di gemelli (due valori che sono presenti in coppia in due celle diverse)
          const cid1 = decodeCellId(cids[0]);
          const cell1 = getCell(cells, cid1)
          const cid2 = decodeCellId(cids[1]);
          const cell2 = getCell(cells, cid2)
          cpls.push(new Couple({ group, cell1, cell2, values: [v,ov] }));
        }
      }
    }
  });

  // ricerca le celle che contengono soltanto i due valori specifici
  const rank = cells.length;
  cells.forEach((cell1, i) => {
    if (cell1.available.length === 2) {
      for (let ci = i + 1; ci < rank; ci++) {
        const cell2 = cells[ci];
        if (hasSameAvailable(cell1, cell2)) {
          cpls.push(new Couple({ cell1, cell2, values: [...cell1.available] }));
        }
      }
    }
  });

  return handler(cpls)
}


/**
 * permette di operare su una determinata cella della collezione
 * @param cells
 * @param arg
 * @param handler
 */
export const onCell = (cells: SudokuCell[], arg: string|Cell|undefined, handler: (cell: SudokuCell) => any): any => {
  const cid = _isString(arg) ? `${arg}` : cellId(<Cell>arg);
  const cell = cells.find(c => c.id === cid);
  if (cell) return handler(cell);
}

/**
 * applica il valore alla cella resettando gli available
 * @param cell
 * @param value
 */
export const applyCellValue = (cell: SudokuCell, value: string) => {
  cell.text = value;
  if (value) cell.available = [];
}

export const isDynamicChar = (k?: string) =>
  [STANDARD_CHARACTERS.dynamic, STANDARD_CHARACTERS.dynamic2].indexOf((k||'').toLowerCase())>-1;

/**
 * restituisce la stringa con tanti "0" quanti il rank (default=81)
 * @param totalRank
 */
export const getBaseValues = (totalRank = DEFAULT_TOTAL_RANK) => _repeat(STANDARD_CHARACTERS.empty, totalRank);

/**
 * vero se lo schema è vuoto
 * @param sdk
 */
export const isEmpty = (sdk?: Sudoku): boolean => {
  const bv = getBaseValues();
  return (sdk?.values||bv) === bv;
}

/**
 * riduce la stringa dello schema
 * d = 00
 * sN = N*0
 * @param sch
 */
export const encodeSdkString = (sch: string) => {
  if ((sch || '').length !== 81) return sch;
  return sch.replace(/0{2,}/g, (m) => (m.length>2) ? `s${m.length}` : 'd');
}

/**
 * recupera la stringa dello schema
 * @param sch
 */
export const decodeSdkString = (sch: string) => {
  if ((sch||'').length>81) return sch;
  return sch.replace(/s(\d)|d/g, (m: string, g: string) => _repeat(STANDARD_CHARACTERS.empty, g ? parseInt(g, 10) : 2));
}

/**
 * restituisce il valore standard (1-9)
 * @param v
 */
export const getStandardValue = (v?: string) => (/[1-9?]/g.test(v||'')) ? v||'' : '';

/**
 * restituisce il valore senza filtri ma su opzione
 * @param cell
 * @param o
 */
export const getValue = (cell?: SudokuCell, o?: ValueOptions): string => {
  const empty = o?.emptyValue||STANDARD_CHARACTERS.empty;
  if (!cell) return empty;
  if (cell.isFixed) return cell.text||empty;
  if (cell.isDynamic && o?.allowDynamic) return cell.text||empty;
  if (cell.text && !cell.isFixed && !cell.isDynamic && o?.allowUserValue) return cell.text||empty;
  return empty;
}

/**
 * restituisce la stringa standard dello schema
 * @param cells
 * @param o
 */
export const getCellsSchema = (cells: SudokuCell[], o?: ValueOptions): string => {
  return (cells||[]).map(cell => getValue(cell, o)).join('');
}

export const isNumberCellValue = (v: string): boolean => /^[1-9]$/g.test(v);
export const isDynamicValue = (v: string): boolean => v === STANDARD_CHARACTERS.dynamic || v === STANDARD_CHARACTERS.dynamic2;

/**
 * costruisce le celle in base alla stringa passata
 * @param v
 * @param o
 */
export const buildSudokuCells = (v?: string, o?: ValueOptions): SudokuCell[] => {
  const rank = DEFAULT_RANK * DEFAULT_RANK;
  v = (v||'').replace(/[^a-zA-Z0-9?]/g, '');
  if (v.length <= rank) v = _padEnd(v, 81, STANDARD_CHARACTERS.empty);
  if (v.length > rank) v = v.substring(0, 81);
  const cells: SudokuCell[] = [];
  forEachCell((c, index) => {
    const cellValue = getStandardValue((v || '').charAt(index));
    if (!o?.onlyValues || !!cellValue)
      cells.push(new SudokuCell({
        ...c,
        text: cellValue||'',
        isFixed: isNumberCellValue(cellValue),
        isDynamic: isDynamicValue(cellValue)
      }));
  });
  return cells;
}

/**
 * vero se la cella contiene errori
 * @param cell
 */
export const cellHasErrors = (cell: SudokuCell): boolean => {
  return _keys(cell.error||{}).length>0;
}

/**
 * vero se tutte le celle sono valorizzate
 * @param cells
 */
export const isComplete = (cells: SudokuCell[]): boolean => {
  return !cells.find(c => !c.text);
}

/**
 * verifica la solvibilità di base
 * @param cells
 */
export const isSolvableCells = (cells: SudokuCell[]): boolean => {
  return cells.filter(c => !!c.text && c.isFixed).length >= SUDOKU_MIN_FIXED_CELLS;
}

export const isCompleteOrError = (cells: SudokuCell[]): boolean => {
  return !cells.find(c => !c.text || cellHasErrors(c));
}

/**
 * restituisce la quantità di valori fissi o dinamici
 * @param cells
 */
export const getNumbers = (cells?: SudokuCell[]): number => {
  return (cells || []).filter(c => c.isFixed || c.isDynamic).length;
}

export const getRank = (cells: SudokuCell[]): number => {
  const count = cells.length;
  return Math.floor(Math.sqrt(count));
}

/**
 * restituisce tutti i gruppi comuni a tutte le celle passate
 * @param cells
 * @param gcs
 */
export const getCommonGroups = (cells: SudokuCell[], gcs: SudokuCell[]): SudokuGroup[] => {
  const groups: SudokuGroup[] = [];
  const commonMap: any = { col: {}, row: {}, sqr: {} };
  gcs.forEach(gc => {
    commonMap.col[`${gc.col}`] = true;
    commonMap.row[`${gc.row}`] = true;
    commonMap.sqr[`${gc.sqr}`] = true;
  });
  _keys(commonMap).forEach(k => {
    const poss = _keys((<any>commonMap)[k]);
    if (poss.length === 1) groups.push(new SudokuGroup({
      pos: parseInt(poss[0], 10),
      type: GroupTypeMap[k]
    }))
  })
  return groups;
}

/**
 * vero se la cella passata "vede" tutti i targets
 * @param cell
 * @param targets
 */
export const canSee = (cell: SudokuCell, ...targets: Cell[]): boolean =>
  targets.every(t => !!AllGroupTypes.find(type => getCellGroupPos(cell, type) === getCellGroupPos(t, type)));

/**
 * restituisce tutte le celle non valorizzate che "vedono" contemporaneamente tutte quelle passate
 * @param cells
 * @param cids
 */
export const getByVisibles = (cells: SudokuCell[], cids: string[]): SudokuCell[] => {
  const targets = <Cell[]>cids.map(cid => decodeCellId(cid)).filter(t => !!t);
  return cells.filter(c => canSee(c, ...targets) && isEmptyCell(c));
}

/**
 * restituisce lo stato dello schema
 * @param cells
 * @param info
 */
export const getStat = (cells: SudokuCell[], info?: Partial<SudokuInfo>): SudokuStat => {
  const stat = new SudokuStat({
    ...info,
    rank: getRank(cells)
  });
  // celle contemporaneamente `fixed` e `dynamic`
  let _fixed_dynamic_count = 0;
  cells.forEach(c => {
    if (isEmptyCell(c) && !isFixedOrDynamic(c)) stat.missingCount++;
    if (c.isFixed) stat.fixedCount++;
    if (c.isDynamic) stat.dynamicCount++;
    if (c.isFixed && c.isDynamic) _fixed_dynamic_count++;
    if (isEmptyDynamic(c)) stat.dynamicEmptyCount++;
    if (!isEmptyCell(c) && !isFixedOrDynamic(c)) stat.userCount++;
    if (c.error && !isFixedOrDynamic(c)) stat.hasErrors = true;
    stat.userValues = `${stat.userValues}${c.text||'0'}`;
  });
  stat.percent = (stat.userCount / (stat.cellCount - stat.fixedCount)) * 100;
  stat.isSolvable = isSolvableCells(cells);
  stat.isComplete = stat.missingCount <= 0;
  stat.fixedAndDynamicCount = stat.fixedCount + stat.dynamicCount - _fixed_dynamic_count;
  // rigenera la classe per aggiornare i valori calcolati
  return new SudokuStat(stat);
}

/**
 * numero di valori fissi e dinamici dello schema
 * @param cells
 */
export const getFixedCount = (cells: SudokuCell[]|string): number => {
  if (_isString(cells)) {
    let fxc = 0;
    for (let i = 0; i < cells.length; i++) {
      const ch = cells.charAt(i);
      if (ch !== '0') fxc++;
    }
    return fxc;
  } else {
    const stat = getStat(cells);
    return stat.fixedAndDynamicCount;
  }
}

export const getSchemaTitle = (cells: SudokuCell[]|SudokuStat): string => {
  const stat = _isArray(cells) ? getStat(cells) : <SudokuStat>cells;
  return `${stat.rankStr} ${stat.fixedCount}num ${stat.difficulty}`;
}

export const getStandardSchemaName = (sudoku: Sudoku|undefined): string => {
  if (!sudoku) return 'unknown';
  const separator = '_';
  const rank = sudoku.info.rank||DEFAULT_RANK;
  const fixc = getFixedCount(sudoku.values);
  const hash = `(${getHash(sudoku.values)})`;
  const diff = sudoku.info?.difficulty ? `${separator}${sudoku.info?.difficulty||''}` : '';
  const tryd = ((sudoku.info?.tryAlgorithmCount||0)>0) ? `${separator}T${sudoku.info?.tryAlgorithmCount||0}` : '';
  return `${rank}x${rank}${separator}${fixc}num${diff}${tryd}${separator}${hash}`;
}

export const getPageArea = (pageId: string, position = 0): string => `${pageId||''}.${position}`;

export const decodeActiveArea = (area: string) => {
  const m = /(.*?)\.(\d+)$/g.exec(area);
  return (m && m.length > 1) ? { pageId: m[1], position: parseInt(m[2], 10) } : { pageId: '', position: -1};
}

/**
 * se l'oggetto non è compatibile con la struttura della classe Sudoku
 * genera un errore
 * @param o
 */
export const checkSudokuObject = (o: any): void => {
  if (!_isObject(o)) throw new Error('undefined sudoku object');
  const sdk = new Sudoku();
  forOwn(sdk, (v,k) => {
    if (typeof (<any>o)[k] !== typeof v) throw new Error(`undefined "${k}" property`);
  });
}

export const getSudokuByFile = (file: any, handler: (sdk: Sudoku) => void): void => {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(<string>reader.result);
      checkSudokuObject(json);
      const sdk = new Sudoku(json);
      handler(sdk);
    } catch (err) {
      console.error(...SDK_PREFIX, 'error parsing sudoku file', err);
    }
  };
  reader.onerror = (err) => console.error(...SDK_PREFIX, 'error parsing sudoku', err);
  reader.readAsText(file);
}


export const isSchemaString = (text: string) => {
  const values = `${text||''}`.trim();
  return values.length === DEFAULT_TOTAL_RANK && /[1-9?]/g.test(values);
}

export const isSudokuObject = (s: any): boolean => {
  return _isObject(s) &&
    _isString((<any>s).values) &&
    _isObject((<any>s).info);
}

export const isExtendedSudoku = (s?: Sudoku): boolean => {
  return _isArray((<SudokuEx>s)?.cells);
}

const getCellUserValues = (c?: SudokuCell): string|undefined =>
  (!!c && !c.isFixed && !c.text && (c.userValues||[]).length>0) ? `[${c.userValues.join(',')}]` : undefined;

export const buildUserValues = (cells: SudokuCell[]): string => {
  return cells
    .map(c => `${c.text||getCellUserValues(c)||''}`)
    .join(';');
}

export const getCellUserValue = (cell: SudokuCell, values_str?: string): UserValue|undefined => {
  if (!values_str) return undefined;
  const index = getCellIndex(cell);
  const values = values_str.split(';');
  const value = values[index]||'';
  const userValues = /^\[.*?]$/g.test(value) ? value.substring(1, value.length-2).split(',') : undefined;
  return (value || userValues) ? <UserValue>{
    text: userValues ? undefined : value,
    userValues
  } : undefined;
}

/**
 * ricalcola le info di schema
 * @param sdk
 */
export const refreshSchemaInfo = (sdk?: SudokuEx): void => {
  if (!sdk) return;
  sdk.info = new SudokuInfoEx({
    ...sdk.info,
    fixedCount: getFixedCount(sdk.values),
  });
}

/**
 * aggiorna la stringa `values` quindi `_id` e `fixedCount` nelle info
 * @param sdk
 */
export const refreshSchemaValues = (sdk?: SudokuEx): void => {
  if (!sdk) return;
  sdk.values = getCellsSchema(sdk.cells);
  sdk._id = sdk.values;
  refreshSchemaInfo(this);
}

/**
 * restituisce la difficoltà espressa con valore numerico
 * @param diff
 * @param def
 */
export const getDiffValue = (diff?: string, def = DIFFICULTY_MIN): number => DIFFICULTY_VALUES[`${diff||def}`.toUpperCase()]||0;

/**
 * restituisce l'identità di uno schema scelto randomicamente dall'elenco
 * @param sdks
 */
export const getRandomId = (sdks: Sudoku[]): string => {
  const index = _random(0, sdks.length);
  return sdks[index]?._id||'';
}
