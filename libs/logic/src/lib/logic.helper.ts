import {
  applySudokuRules,
  checkStatus,
  GenerationStat,
  getCellsSchema,
  getCellUserValue,
  getFixedCount,
  getRank,
  isComplete,
  isSolvableCells,
  onCell,
  SolveOptions,
  SolveSolution,
  SolveStat,
  SolveWork,
  SudokuCell,
  SudokuEx,
  SudokuInfoEx,
  UserValue,
  ValueOptions,
} from '@olmi/model';
import { keys as _keys, lowerCase as _lowerCase, uniq as _uniq } from 'lodash';
import { calcDifficulty } from './logic.difficulty';
import { GeneratorContext } from './logic.model';

export const clearCell = (c: SudokuCell, uv?: UserValue) => {
  c.text = uv?.text || '';
  c.userValues = uv?.userValues || [];
  c.isDynamic = false;
  c.isFixed = false;
  delete c.error;
};

export const isValidToStep = (o: SolveOptions): boolean => o.mode === 'to-step' && o.toStep > 0;


/**
 * cancella tutti i valori utente resettando i valori possibili per le celle vuote
 * @param cells
 * @param o
 */
export const clearSchema = (cells?: SudokuCell[], o?: ValueOptions) => {
  (cells||[])
    .filter(c => o?.schemaMode || (!c.isFixed && !c.isDynamic))
    .forEach(c => {
      const uv = getCellUserValue(c, o?.userValues);
      clearCell(c, uv);
    });
  checkStatus(cells, { resetBefore: true });
}



/**
 * completo se il conteggio supera l'impostazione di massimo numero di cicli
 * @param work
 */
export const checkMaxCyclesComplete = (work: SolveWork): void => {
  if (work.counter > work.options.maxSolveCycles) {
    work.solutions
      .filter(s => s.status === 'idle')
      .forEach(s => s.status = 'out-of-range');
  }
}

/**
 * valuta il termine sulla modalità to-step
 * @param work
 */
export const checkToStepComplete = (work: SolveWork): void => {
  if (work.counter > 0 && work.options.mode === 'to-step' && work.options.toStep > 0) {
    if (work.solutions.length === 1 && work.solutions[0].sequence.length >= work.options.toStep) {
      while (work.solutions[0].sequence.length > work.options.toStep) {
        work.solutions[0].sequence.pop();
      }
      if (work.solutions[0].status === 'idle') work.solutions[0].status = 'success';
    }
  }
}

/**
 * vero se lo schema è già stato gestito
 * @param ctx
 */
export const isSchemaHandled = (ctx: GeneratorContext): boolean => {
  return !!ctx.schemas[ctx.session.currentSchema?.values||''];
}

/**
 * valuta il termine sulla modalità to-try
 * @param work
 */
export const checkToTryComplete = (work: SolveWork): void => {
  if (work.counter > 0 && work.options.mode === 'to-try') {
    if (work.solutions.length>1) {
      while(work.solutions.length>1) {
        work.solutions.pop();
      }
      const solution = work.solutions[0];
      const deleted = solution.sequence.pop();
      if (deleted?.cells) {
        clearCells(solution.cells, deleted.cells);
        applySudokuRules(solution.cells, { resetBefore: true });
      }
      solution.status = 'success';
    }
  }
}

const clearCells = (cells: SudokuCell[], ids: string[]): void => {
  ids.forEach(cid => onCell(cells, cid, (c) => c.text = ''));
}

/**
 * verifica il target della modalità to-step per gli schemi a soluzione unica e
 * nel caso in cui sia stato utilizzato un algoritmo che preveda lo split dello schema
 * @param work
 */
export const checkToStepItem = (work: SolveWork): void => {
  if (work.options.mode === 'to-step' && work.options.toStep > 0) {
    const scss = work.solutions.filter(s => s.status === 'success');
    if (scss.length === 1) {
      while (scss[0].sequence.length > work.options.toStep) {
        const deleted = scss[0].sequence.pop();
        if (deleted?.value) clearCells(scss[0].cells, deleted.cells);
      }
      applySudokuRules(scss[0].cells, { resetBefore: true });
    }
  }
}

/**
 *
 * @param work
 * @param onCycle
 */
export const checkOneStepComplete = (work: SolveWork, onCycle = false): void => {
  if (work.options.mode === 'one-step' && work.counter > 0) {
    if (work.solutions.length > 1) {
      if (work.solutions[0].status === 'idle') work.solutions[0].status = 'try-stop';
      while (work.solutions.length > 1) {
        work.solutions.pop();
      }
    } else if (!onCycle && work.solutions.length === 1) {
      if (work.solutions[0].status === 'idle') work.solutions[0].status = 'success';
    }
  }
}

/**
 * vero se la sessione ha ancora cicli di risoluzione possibili
 * @param work
 */
export const isSolvableWork = (work: SolveWork): boolean => {
  // sogla come non risolvibili quelli non risolvibili
  work.solutions.forEach(s => {
    if (!isSolvableCells(s.cells)) s.status = 'not-solvable';
  });
  return !!work.solutions.find(s => s.status === 'idle' && !isComplete(s.cells));
}

const getStatError = (s: SolveStat, work: SolveWork): string|undefined => {
  if (!s.isUniqueSuccess) {
    if (s.isOutOfRange) return 'out of range';
    const status = _uniq(work.solutions.map(s => _lowerCase(s.status)));
    return status.join(',');
  }
  return undefined;
}

export const getWorkStat = (work: SolveWork): SolveStat => {
  const stat = new SolveStat();
  stat.isOutOfRange = work.solutions.filter(s => s.status === 'out-of-range').length > 0;
  const scs = work.solutions.filter(s => s.status === 'success');
  stat.isSuccess = scs.length > 0;
  stat.unique = scs.length === 1;
  stat.isUniqueSuccess = stat.isSuccess && stat.unique;
  stat.solution = stat.isUniqueSuccess ? scs[0] : undefined;
  stat.error = getStatError(stat, work);
  return stat;
}

export const getSudokuInfo = (solution?: Partial<SolveSolution>): SudokuInfoEx => {
  return new SudokuInfoEx({
    rank: getRank(solution?.cells || []),
    unique: (solution?.sequence || []).length > 0,
    fixedCount: getFixedCount(solution?.cells || []),
    solution: solution?.sequence,
    ...calcDifficulty(solution?.sequence, solution?.cells)
  });
}

/**
 * restituisce la soluzione unica effettiva della statistica del calcolo
 * @param stat
 */
export const getSolutionByStat = (stat: SolveStat): SudokuEx|undefined => {
  if (!stat.isUniqueSuccess) return undefined;
  const info = getSudokuInfo(stat.solution);
  return new SudokuEx({ cells: stat.solution?.cells||[], info });
}

/**
 * restituisce la soluzione unica effettiva del calcolo
 * @param work
 */
export const getSolution = (work: SolveWork): SudokuEx|undefined => {
  const stat = getWorkStat(work);
  return getSolutionByStat(stat);
}

/**
 * genera le statistiche di generazione
 * @param ctx
 */
export const getGenerationStat = (ctx: GeneratorContext): GenerationStat => {
  return new GenerationStat({
    generatedSchema: ctx.schema$.value,
    currentSchema: getCellsSchema(ctx.session.currentSchema?.cells||[]),
    generatedSchemaCount: _keys(ctx.schemas).length,
    managedSchemaCount: ctx.session.schemaFillCycle
  })
}
