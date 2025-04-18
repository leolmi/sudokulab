import { GenerationSession, GeneratorContext } from './logic.model';
import {
  GeneratorOptions,
  getCellsSchema,
  LogicWorkerData, refreshSchemaValues,
  setCellFixedValue,
  SudokuEx,
  ValorizationMode
} from '@olmi/model';
import { solve } from './logic.solver';
import { getSolution, isSchemaHandled } from './logic.helper';
import { cloneDeep as _clone, random as _random } from 'lodash';
import {
  addDynamicCell, calcSolution,
  clearDynamics,
  isSchemaComplete,
  isSchemaFilled,
  isSessionComplete,
  schemaHasErrors,
  shuffleCells,
  updateSchemaAdvanced
} from './logic.generator.helper';

/**
 * rigenera lo schema per il calcolo posizionando celle
 * dinamiche secondo le opzioni
 * @param ctx
 */
const completeSchema = (ctx: GeneratorContext): void => {
  ctx.session.skipSchema = false;
  // genera lo schema per il calcolo
  ctx.session.currentSchema = new SudokuEx({ cells: _clone(ctx.session.originalCells) });
  let complete = false;
  // aggiunge celle dinamiche fino al raggiungimento del numero di valori richiesto
  while (!isSchemaComplete(ctx) || complete) {
    // se non riesce ad aggiungere nuove celle dinamiche esce
    if (!addDynamicCell(ctx)) complete = true;
  }
  // resetta il contatore per le valorizzazioni
  ctx.session.schemaFillCycle = 0;
}

/**
 * tenta di valorizzare le celle dinamiche dello schema
 * @param ctx
 */
const _tryFillCurrentSchema = (ctx: GeneratorContext): boolean => {
  updateSchemaAdvanced(ctx, () => clearDynamics(ctx));
  switch(ctx.session.options.valuesMode) {
    case ValorizationMode.auto:
      // TODO???
      // return false;
    case ValorizationMode.sequential:
      // TODO???
      // return false;
    case ValorizationMode.random:
    default:
      const cells = (ctx.session.currentSchema?.cells||[]).filter(c => c.isDynamic);
      shuffleCells(cells).forEach(c => {
        if (!isSchemaFilled(ctx) && !schemaHasErrors(ctx)) {
          const ri = _random(c.available.length - 1);
          updateSchemaAdvanced(ctx, () => setCellFixedValue(c, c.available[ri]));
        }
      });
      refreshSchemaValues(ctx.session.currentSchema);
      return isSchemaFilled(ctx) && !schemaHasErrors(ctx) && !isSchemaHandled(ctx);
  }
}

/**
 * il ciclo di valorizzazione è valido se non supera i tentativi di valorizzazione e
 * le valorizzazioni per schema totali già validate
 * @param ctx
 * @param cycle
 */
const _isValidFillCycle = (ctx: GeneratorContext, cycle: number): boolean => {
  return cycle < ctx.session.options.maxFillCycles &&
    ctx.session.schemaFillCycle < ctx.session.options.maxSchemaFillCycles;
}

/**
 * valorizza le celle dinamiche lo schema
 * @param ctx
 */
const fillCurrentSchema = (ctx: GeneratorContext): void => {
  ctx.session.schemaFillCycle++;
  let cycle = 0;
  while(!_tryFillCurrentSchema(ctx) && _isValidFillCycle(ctx, cycle)) {
    cycle++
  }
}

/**
 * vero se lo schema può essere valorizzato ancora
 * @param ctx
 */
const needValorization = (ctx: GeneratorContext): boolean => {
  // aggiunge alla cache lo schema appena utilizzato
  // TODO: estrae solo i valori e non i dinamici
  const values = getCellsSchema(ctx.session.currentSchema?.cells || [], { allowDynamic: true });
  ctx.session.cache[values] = true;
  return ctx.session.currentStat.dynamicCount > 0 &&
    ctx.session.schemaFillCycle < ctx.session.options.maxSchemaFillCycles &&
    !ctx.session.skipSchema &&
    !isSessionComplete(ctx);
}

/**
 * vero se richiede l'inserimento di valori fissi generati
 * @param ctx
 */
const isMultiSchema = (ctx: GeneratorContext): boolean =>
  ctx.session.originalStat.fixedAndDynamicCount < ctx.session.options.fixedCount;

/**
 * lo schema può essere rigenerato quando le celle fisse e dinamiche non
 * bastano per raggiungere il numero di valori richiesti
 * @param ctx
 */
const needNewSchema = (ctx: GeneratorContext): boolean => {
  return (isMultiSchema(ctx) || ctx.session.skipSchema) && !isSessionComplete(ctx);
}



/**
 * avvia la generazione
 * @param ctx
 */
const _startGeneration = async (ctx: GeneratorContext) => {
  // fasi della generazione:
  if (ctx.session.time) {

    do {
      // 1. riempimento dello schema secondo le opzioni (aggiunta di valori dinamici)
      completeSchema(ctx);

      do {
        // 2. valorizzazione dello schema secondo opzioni
        fillCurrentSchema(ctx);

        // 3. effettua un ping per gestire il progresso
        await ctx.ping();

        // 4. risoluzione schema
        calcSolution(ctx, sdk => {
          ctx.addSchema(sdk);
          // se impostato aggiorna lo schema dopo 1 generazione
          if (isMultiSchema(ctx) && ctx.session.options.oneForSchema) ctx.session.skipSchema = true;
        });

        // 5. se lo schema può essere ancora valorizzato passa al >>2;
      } while (needValorization(ctx));

      // 6. se sono terminate le possibilità di valorizzazione ma lo schema può ancora definito passa >>1.
    } while (needNewSchema(ctx));
  }

  // 7. termina il processo di generazione.
  return ctx.endGeneration();
}

const _initSession = (context: GeneratorContext, args: LogicWorkerData) => {
  context.session = new GenerationSession({
    options: <GeneratorOptions>args.options,
    originalCells: _clone((<SudokuEx>args.sudoku)?.cells||[]),
    time: Date.now()
  });
}

/**
 * avvia la generazione di schemi
 * @param context
 * @param args
 */
export const startGeneration = (context: GeneratorContext, args: LogicWorkerData) => {
  // se c'è una sessione attiva non parte
  if (context.session.time) return;
  _initSession(context, args);
  _startGeneration(context).then(() => context.ping());
  context.ping();
}

/**
 * genera uno schema sulla base delle opzioni fornite
 * @param context
 * @param args
 */
export const generateSchema = (context: GeneratorContext, args: LogicWorkerData): SudokuEx|undefined => {
  // se c'è una sessione attiva non parte
  if (context.session.time) return;
  _initSession(context, args);
  completeSchema(context);
  context.session.time = 0;
  return context.session.currentSchema;
}
