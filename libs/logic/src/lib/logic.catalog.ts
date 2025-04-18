import { buildSudokuCells, getSchemaTitle, LogicWorkerData, Sudoku } from '@olmi/model';
import { solve } from './logic.solver';
import { clearSchema, getSolution } from './logic.helper';
import { isArray as _isArray, isObject, keys, values as _values } from 'lodash';

/**
 * genera un catalogo di Sudoku da un elenco di schemi (stringhe)
 * @param args
 */
// export const createCatalog = (args: LogicWorkerData) => {
//   args.catalog = [];
//   const schemas = _isArray(args.params) ? <string[]>args.params : <string[]>_values(<any>args.params);
//   const names = isObject(args.params) ? <any>args.params : <any>{};
//   for (const schema of schemas) {
//     const cells = buildSudokuCells(schema);
//     const result = solve(cells, { useTryAlgorithm: true });
//     const solution = getSolution(result);
//     if (solution) {
//       const name = keys(names).find(k => names[k]===schema);
//       if (name) solution.name = name;
//       clearSchema(solution.cells);
//       args.catalog.push(solution);
//     }
//   }
// }
