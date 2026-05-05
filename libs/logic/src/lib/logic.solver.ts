import {
  AlgorithmType,
  buildSudokuCells,
  checkStatus,
  decodeCellId,
  getCellIndex,
  getCellsSchema,
  hasErrors,
  isComplete,
  SDK_PREFIX,
  SolveOptions,
  SolveSolution,
  SolveWork,
  Sudoku,
  SudokuCell,
  SudokuEx
} from '@olmi/model';
import { findFirstAppliedAlgorithm, getAlgorithm } from '@olmi/algorithms';
import {
  checkMaxCyclesComplete,
  checkOneStepComplete,
  checkToStepComplete,
  checkToStepItem,
  checkToTryComplete,
  clearSchema,
  isSolvableWork,
  isValidToStep
} from './logic.helper';
import { cloneDeep as _clone, isArray as _isArray } from 'lodash';

/**
 * processa il singolo step
 * @param work
 * @param step
 * @param index
 */
const solveStep = (work: SolveWork, step: SolveSolution, index = 0) => {
  work.counter++;
  const res = findFirstAppliedAlgorithm(step.cells, work.options);
  if (res?.applied && step.status === 'idle') {
    if (work.options.debug) console.log(`step result found (way=${index})`, res, '\n\ton step', _clone(step));
    step.sequence.push(res);
    const alg = getAlgorithm(res.algorithm);
    // se è un algoritmo risolutivo considera terminato lo step
    if (alg?.type === AlgorithmType.solver) {
      if (res.cases.length > 0) {
        const splitCell = res.cells?.[0] || '?';
        // Oracolo: se nota la soluzione unica, collassa i casi al solo
        // ramo corretto evitando di generare branch paralleli sprecati.
        let oracleResolved = false;
        if (work.options.oracleSolution && res.cells?.length) {
          const cell = decodeCellId(splitCell);
          if (cell) {
            const oracleVal = work.options.oracleSolution.charAt(getCellIndex(cell));
            const correct = res.cases.find(cs => cs.find(cc => cc.id === splitCell)?.text === oracleVal);
            if (correct) {
              res.cases = [correct];
              oracleResolved = true;
            }
          }
        }
        const branches = res.cases.length;
        const splitValues = res.cases.map(cs => {
          const c = cs.find(cc => cc.id === splitCell);
          return c?.text || '?';
        });
        if (!oracleResolved) {
          // board e candidati residui al momento dello split
          const board = getCellsSchema(step.cells, { allowDynamic: true, allowUserValue: true });
          const candidates = step.cells
            .filter(c => !c.text && c.available.length > 0)
            .map(c => `${c.id}=[${c.available.join('')}]`)
            .join(' ');
          console.log(...SDK_PREFIX, `[pre-split] way=${index} board=${board}`);
          console.log(...SDK_PREFIX, `[pre-split] way=${index} candidates: ${candidates}`);
        }
        step.cells = <SudokuCell[]>(res.cases||[]).shift();
        // aggiunge gli altri casi come percorsi alternativi al principale
        res.cases.forEach(cells => work.solutions.push(new SolveSolution({ cells, sequence: _clone(step.sequence) })));
        if (oracleResolved) {
          console.log(...SDK_PREFIX, `[oracle] ${res.algorithm} on cell ${splitCell} resolved to value ${splitValues[0]} way=${index}`);
        } else {
          console.log(...SDK_PREFIX, `[split] ${res.algorithm} on cell ${splitCell} into ${branches} branches (values=[${splitValues.join(',')}]) way=${index} total solutions=${work.solutions.length}`);
        }
      }
      if (isComplete(step.cells)) {
        step.status = 'success';
      }
    } else {
      // se non è un algoritmo risolutivo procede ancora una volta
      if (isSolvable(work, true)) solveStep(work, step, index);
    }
    if (work.options.debug) console.log(...SDK_PREFIX, `[step] counter=${work.counter} way=${index} algo=${res.algorithm} solutions=${work.solutions.length}`);
  } else {
    // console.log('no step result found');
    // se nessun algoritmo da risultati completa
    if (hasErrors(step.cells)) {
      step.status = 'error';
    } else if (step.status === 'idle') {
      step.status = 'undefined';
    }
  }
}

/**
 * processa tutti gli step paralleli
 * @param work
 */
const solveParallelStep = (work: SolveWork) => {
  work.solutions.forEach((s, i) => {
    if (s.status === 'idle') solveStep(work, s, i);
  });
}

const isSolvable = (work: SolveWork, onCycle = false): boolean => {
  // il ciclo di risoluzione termina quando:
  // 1. il numero di cicli ha superato il massimo
  checkMaxCyclesComplete(work);
  // 2. modalità to-step conclusa
  checkToStepComplete(work);
  // 3. modalita one-step conclusa
  checkOneStepComplete(work, onCycle);
  // 4. modalità to-try conclusa
  checkToTryComplete(work);
  // 5. nessuna soluzione è in stato idle
  return isSolvableWork(work);
}

const initSolver = (cells: SudokuCell[], o?: Partial<SolveOptions>): SolveWork => {
  const step = new SolveSolution({ cells });
  const options = new SolveOptions(o);
  if (isValidToStep(options)) clearSchema(step.cells);
  checkStatus(step.cells, { resetBefore: true });
  return new SolveWork({ options, solutions: [step] });
}

const endSolver = (work: SolveWork) => {
  work.end = Date.now();
  checkToStepItem(work);
  if (work.options?.debug) console.log(...SDK_PREFIX, `solver ends in ${(work.end-work.start).toFixed(0)}mls`, work);
  // diagnostica: segnala se due soluzioni success hanno lo stesso board (bug di duplicazione)
  const successes = work.solutions.filter(s => s.status === 'success');
  if (successes.length > 1) {
    const snapshot = (s: SolveSolution) => getCellsSchema(s.cells, { allowUserValue: true, allowDynamic: true });
    const byValues: Record<string, number[]> = {};
    successes.forEach((s, i) => {
      const key = snapshot(s);
      (byValues[key] = byValues[key] || []).push(i);
    });
    const dupes = Object.entries(byValues).filter(([, idxs]) => idxs.length > 1);
    if (dupes.length > 0) {
      console.warn(...SDK_PREFIX, `[solve] DUPLICATE solutions detected: ${successes.length} success branches, ${dupes.length} distinct board(s) duplicated`);
      dupes.forEach(([key, idxs]) => {
        console.warn(...SDK_PREFIX, `  duplicated board "${key}" appears in success branches [${idxs.join(',')}]`);
        idxs.forEach(i => {
          const algos = successes[i].sequence.map(r => r.algorithm).join(' > ');
          console.warn(...SDK_PREFIX, `  branch[${i}] steps: ${algos}`);
        });
      });
    }
  }
}

/**
 * risolve lo schema per step
 * @param arg
 * @param o
 */
export const solve = (arg?: SudokuCell[]|Sudoku, o?: Partial<SolveOptions>): SolveWork => {
  const cells = _isArray(arg) ?
    <SudokuCell[]>arg :
    (<SudokuEx>arg)?.cells||buildSudokuCells((<Sudoku>arg)?.values||'')||[];
  // init results
  const work = initSolver(cells||[], o);
  if (o?.debug) console.log(...SDK_PREFIX, 'solver start', work);
  while (isSolvable(work)) {
    solveParallelStep(work);
  }
  endSolver(work);
  return work;
}
