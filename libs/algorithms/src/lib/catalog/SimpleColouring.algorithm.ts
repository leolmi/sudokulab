import {
  Algorithm,
  AlgorithmOptions,
  AlgorithmResult,
  AlgorithmType,
  canSee,
  findGroup,
  getCoords,
  isEmptyCell,
  SudokuCell
} from '@olmi/model';
import { applyAlgorithm, getHighlights, getSingleResultLine, onRemoved, registerAlgorithm } from '../algorithms.common';
import { keys as _keys } from 'lodash';

export const SIMPLE_COLOURING_ALGORITHM = 'SimpleColouring';

/**
 * ALGORITMO Simple Colouring (Single Chains)
 *
 * Per un valore V, costruisce il grafo delle coppie "conjugate" (gruppi in
 * cui V compare in esattamente 2 celle). Ogni componente connessa si colora
 * con 2 colori alternati. Si applicano due regole:
 *
 * - **Color Trap**: se due celle dello stesso colore vedono una terza cella
 *   esterna che può contenere V → V può essere rimosso da quella cella.
 * - **Color Wrap**: se due celle dello stesso colore si trovano nello stesso
 *   gruppo → tutte le celle di quel colore sono FALSE, quindi V può essere
 *   rimosso da tutte loro.
 */
export class SimpleColouringAlgorithm extends Algorithm {
  id = SIMPLE_COLOURING_ALGORITHM;
  priority = 13;
  factor = '+280+(NEP*100)';
  name = 'Simple Colouring';
  icon = 'palette';
  type = AlgorithmType.support;
  title = 'Costruisce catene di coppie coniugate per un valore e ne sfrutta la colorazione alternata per escludere candidati';
  description = 'Tecnica avanzata basata sulle coppie coniugate di un singolo valore. Efficace per evitare il ricorso al brute-force in molti schemi';
  options = <AlgorithmOptions>{
    checkAvailableOnStep: true
  }

  apply = (cells: SudokuCell[]): AlgorithmResult =>
    applyAlgorithm(this, cells, (res) => {
      for (let n = 1; n <= 9 && !res.applied; n++) {
        applyForValue(this, cells, res, `${n}`);
      }
    });
}

const applyForValue = (alg: Algorithm, cells: SudokuCell[], res: AlgorithmResult, value: string): void => {
  // trova tutte le coppie coniugate per value
  const pairs: [string, string][] = [];
  findGroup(cells, (gcells) => {
    const pos = gcells.filter(c => isEmptyCell(c) && c.available.includes(value));
    if (pos.length === 2) pairs.push([pos[0].id, pos[1].id]);
    return false;
  });
  if (pairs.length < 2) return;

  // costruisce il grafo di adiacenza
  const adj: { [k: string]: string[] } = {};
  pairs.forEach(([a, b]) => {
    (adj[a] = adj[a] || []).push(b);
    (adj[b] = adj[b] || []).push(a);
  });

  const globalColor: { [k: string]: 0 | 1 } = {};
  for (const start of _keys(adj)) {
    if (globalColor[start] !== undefined) continue;
    // BFS per colorare una componente connessa tracciandone i nodi
    const byColor: [string[], string[]] = [[], []];
    globalColor[start] = 0;
    byColor[0].push(start);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of adj[cur]) {
        if (globalColor[next] === undefined) {
          const nc = globalColor[cur] === 0 ? 1 : 0;
          globalColor[next] = nc;
          byColor[nc].push(next);
          queue.push(next);
        }
      }
    }
    const componentIds = [...byColor[0], ...byColor[1]];
    if (componentIds.length < 3) continue;

    // Color Wrap: due celle dello stesso colore nello stesso gruppo
    for (const col of [0, 1] as const) {
      const ids = byColor[col];
      for (let i = 0; i < ids.length; i++) {
        const ci = cells.find(c => c.id === ids[i])!;
        for (let j = i + 1; j < ids.length; j++) {
          const cj = cells.find(c => c.id === ids[j])!;
          if (ci.row === cj.row || ci.col === cj.col || ci.sqr === cj.sqr) {
            for (const fid of ids) {
              const fc = cells.find(c => c.id === fid)!;
              onRemoved(fc, value, (removed) => {
                res.applied = true;
                res.highlights = getHighlights(fc, ids);
                res.descLines = getSingleResultLine(fc,
                  `${alg.name} color-wrap on value "${value}": cells ${ci.coord} and ${cj.coord} share a group, so value [${removed.join(',')}] removed from cell ${fc.coord}`);
              });
              if (res.applied) return;
            }
          }
        }
      }
    }

    // Color Trap: cella esterna che vede celle di entrambi i colori
    const externals = cells.filter(c =>
      isEmptyCell(c) &&
      c.available.includes(value) &&
      !componentIds.includes(c.id));
    for (const ec of externals) {
      const seesA = byColor[0].some(id => canSee(ec, cells.find(c => c.id === id)!));
      const seesB = byColor[1].some(id => canSee(ec, cells.find(c => c.id === id)!));
      if (seesA && seesB) {
        onRemoved(ec, value, (removed) => {
          res.applied = true;
          res.highlights = getHighlights(ec, componentIds);
          res.descLines = getSingleResultLine(ec,
            `${alg.name} color-trap on value "${value}": cell ${ec.coord} sees both colors of chain ${getCoords(componentIds)}, so value [${removed.join(',')}] removed`);
        });
        if (res.applied) return;
      }
    }
  }
}

// registra l'algoritmo
registerAlgorithm(new SimpleColouringAlgorithm());
