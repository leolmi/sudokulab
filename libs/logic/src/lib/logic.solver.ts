import {
  AlgorithmType,
  buildSudokuCells,
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
  checkStatus,
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
        step.cells = <SudokuCell[]>(res.cases||[]).shift();
        // aggiunge gli altri casi come percorsi alternativi al principale
        res.cases.forEach(cells => work.solutions.push(new SolveSolution({ cells, sequence: _clone(step.sequence) })));
        // console.log('solutions counter = ', work.solutions.length);
      }
      if (isComplete(step.cells)) {
        step.status = 'success';
      }
    } else {
      // se non è un algoritmo risolutivo procede ancora una volta
      if (isSolvable(work, true)) solveStep(work, step, index);
    }
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
  if (!!work.options?.debug) console.log(...SDK_PREFIX, `solver ends in ${(work.end-work.start).toFixed(0)}mls`, work);
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
  if (!!o?.debug) console.log(...SDK_PREFIX, 'solver start', work);
  while (isSolvable(work)) {
    solveParallelStep(work);
  }
  endSolver(work);
  return work;
}
