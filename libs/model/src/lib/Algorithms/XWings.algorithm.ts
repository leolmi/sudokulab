import { Algorithm } from '../Algorithm';
import { PlaySudoku } from '../PlaySudoku';
import { AlgorithmResult, AlgorithmResultLine } from '../AlgorithmResult';
import { forEach as _forEach, remove as _remove } from 'lodash';
import { PlaySudokuGroup } from '../PlaySudokuGroup';
import { checkAvailable, getGroupNOnCells, getGroupValues, GroupValuesOnCells } from '../logic';
import { AlgorithmType, SudokuGroupType } from '../enums';
import { SUDOKU_DEFAULT_RANK } from '../consts';
import { cellId, decodeCellId, getUserCoord, groupId } from '../../sudoku.helper';
import { CellInfo } from '../CellInfo';

export const XWINGS_ALGORITHM = 'XWings';

interface GroupInfo {
  /**
   * identificativo del gruppo
   */
  gid: string,
  /**
   * gruppo (row or column)
   */
  group: PlaySudokuGroup|undefined,
  /**
   * coppie di valori identici tra quelli possibili
   * { n1: [cid11, cid12], ..., nN: [cidN1, cidN2] }
   * > per ogni numero esiste una sola coppia di celle che lo ospita
   */
  couples: GroupValuesOnCells
}

interface XAlignInfo {
  cells: string[],
  group: string
}

/**
 * ALGORITMO
 * X-Wings
 *
 * Quando due righe (o due colonne) contengono solamente due posizioni possibili per un dato numero e
 * quelle due posizioni si trovano nelle stesse due colonne (o due righe), si può eliminare quel
 * numero da tutte le altre posizioni ancora possibili delle due colonne (o due righe).
 *
 * fattore: +20
 */
export class XWingsAlgorithm extends Algorithm {
  id = XWINGS_ALGORITHM;
  // il twins è più difficile da vedere e usare se sono molti i numeri mancanti
  factor = '+150';
  name = 'X-Wings';
  icon = 'grid_view';
  type = AlgorithmType.support;
  title = 'Quando due righe (o due colonne) contengono solamente due posizioni possibili per un dato numero e quelle due posizioni si trovano nelle stesse due colonne (o due righe), si può eliminare quel numero da tutte le altre posizioni ancora possibili delle due colonne (o due righe).';
  description = `Come altri algoritmi non risolve un valore specifico ma contribuisce nell'escludere valori possibili dalle celle interessate`;
  apply = (sdk: PlaySudoku): AlgorithmResult => {
    let applied = false;
    const descLines: AlgorithmResultLine[] = [];

    // per entrambe le tipologie di gruppo sviluppa l'algoritmo
    [SudokuGroupType.row, SudokuGroupType.column].forEach(t1 => {
      // tipo complementare
      // const t2 = (t1 === SudokuGroupType.row) ? SudokuGroupType.column : SudokuGroupType.row;
      const rank = sdk.sudoku?.rank || SUDOKU_DEFAULT_RANK;
      for (let i1 = 0; i1 < rank; i1++) {
        // 1. ricerca nel gruppo quelle coppie di celle che possono ospitare univocamente un determinato valore
        const info1 = _getGroupInfo(sdk, t1, i1);
        _forEach(info1.couples, (cids1, n1) => {
          if ((cids1 || []).length === 2 && n1) {
            // scorre gli altri gruppi dello stesso tipo alla ricerca di uno
            // con coppie attigue
            for (let i2 = i1+1; i2 < rank; i2++) {
              const info2 = _getGroupInfo(sdk, t1, i2);

              // 2. se presenti in più occorrenze > ricerca delle coppie allineate tra i tipi 1
              _forEach(info2.couples, (cids2, n2) => {
                if (n2 === n1) {
                  _parseXAlign(cids1 || [], cids2 || [], t1, rank, (xa) => {
                    // 3. se presenti > eliminazione valori delle coppie nelle altre celle del tipo 2
                    const g = sdk.groups[xa.group];
                    if (g) {
                      g.cells.forEach(cid => {
                        if (!xa.cells.includes(cid)) {
                          const cell = sdk.cells[cid];
                          if (cell && !cell.value && !cell.fixed) {
                            const removed = _remove(cell.availables || [], v => v === n1);
                            if (removed.length > 0) {
                              applied = true;
                              const ids = (cids1 || []).concat(...(cids2 || []));
                              descLines.push(new AlgorithmResultLine({
                                cell: cid,
                                others: ids,
                                description: `Found x-wings ${ids.map(tid => getUserCoord(tid)).join(' ')} per il valore [${n1}],
so [${removed.join(',')}] have been removed on ${getUserCoord(cid)}`
                              }));
                            }
                          }
                        }
                      })
                    }
                  });
                }
              });
            }
          }
        });
      }
    });

    if (applied) checkAvailable(sdk);

    return new AlgorithmResult({
      algorithm: this.id,
      applied,
      descLines
    }, sdk);
  }
}

/**
 * restituisce le info utili di gruppo per l'analisi del x-wing
 * @param sdk
 * @param type
 * @param index
 */
const _getGroupInfo = (sdk: PlaySudoku, type: SudokuGroupType, index: number): GroupInfo => {
  // id gruppo
  const gid = groupId(type, index);
  // gruppo 1 tipo 1
  const group = sdk.groups[gid];
  // valori possibili per cella del gruppo 1 tipo 1
  const vls = getGroupValues(group);
  // coppie di valori identici tra quelli possibili
  // { n1: [cid11, cid12], ..., nN: [cidN1, cidN2] }
  // >> per ogni numero esiste una sola coppia di celle che lo ospita
  const couples = getGroupNOnCells(vls, 2);

  return <GroupInfo>{
    gid,
    group,
    couples
  }
}

/**
 * restituisce la cella gemella
 * @param id1
 * @param cids
 * @param type
 * @param rank
 */
const _getTwinCell = (id1: CellInfo, cids: string[], type: SudokuGroupType, rank: number): CellInfo|undefined => {
  const rgx = type === SudokuGroupType.column ?
    new RegExp(`\\.${id1.row}$`, 'g') :
    new RegExp(`^${id1.col}\\.`, 'g');
  const id2 = cids.find(cid => rgx.test(cid));
  return id2 ? decodeCellId(id2, rank) : undefined;
}

/**
 * restituisce le info di allineamento
 * @param i1
 * @param i2
 * @param type
 */
const _getXAlign = (i1: CellInfo|undefined, i2: CellInfo|undefined, type: SudokuGroupType): XAlignInfo|undefined => {
  if (!i1 || !i2) return undefined;
  const id1 = cellId(i1.col, i1.row);
  const id2 = cellId(i2.col, i2.row);
  const cells = [id1, id2];
  const gType = (type === SudokuGroupType.column) ? SudokuGroupType.row : SudokuGroupType.column;
  const gPos = (type === SudokuGroupType.column) ? i1.row : i1.col;
  const group = groupId(gType, gPos);
  return <XAlignInfo>{ cells, group };
}

/**
 * scorre le celle allineate
 * @param cids1
 * @param cids2
 * @param type
 * @param rank
 * @param handler
 */
const _parseXAlign = (cids1: string[], cids2: string[], type: SudokuGroupType, rank: number, handler: (x: XAlignInfo) => void): void => {
  if ((cids2 || []).length !== 2 || (cids1 || []).length !== 2) return;
  const xas = <XAlignInfo[]>cids1
    .map(cid1 => {
      const id1 = decodeCellId(cid1, rank);
      const id2 = _getTwinCell(id1, cids2, type, rank);
      return _getXAlign(id1, id2, type);
    })
    .filter(x => !!x);
  if (xas.length===2) xas.forEach(x => handler(x));
}
