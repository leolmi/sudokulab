import {
  buildSudokuInfo,
  checkImportText,
  getHash,
  PlaySudoku,
  SDK_PREFIX_W,
  SolveAllResult,
  Solver,
  Sudoku,
  SUDOKULAB_MANAGE_OPERATION,
  SudokuSolution
} from '@sudokulab/model';
import { Model } from 'mongoose';
import { cloneDeep as _clone } from 'lodash';
import { SudokuDoc } from '../../model/sudoku.interface';

export const manage: {[name: string]: (model: Model<SudokuDoc>, args?: any) => Promise<any>} = {

  /**
   * Risincronizza tutti gli schemi in db
   * @param args
   */
  [SUDOKULAB_MANAGE_OPERATION.resyncAll]: (model: Model<SudokuDoc>, args?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      // cicla tutti gli schemi risolvendoli uno a uno e aggiornando le info
      try {
        model.find().then(async (schemas) => {
          let i = 0;
          const LN = schemas.length;
          do {
            const sudoku = schemas[i];
            const fixed = checkImportText(sudoku.fixed);
            const values = checkImportText(sudoku.values);
            // verifica dei valori
            if (sudoku.fixed !== fixed || sudoku.values !== values) {
              await sudoku.remove().catch(err_r => console.error(`Error while removing doc "${sudoku._id}"`, err_r));
            } else {
              // risolve lo schema
              const result = solveSchema(sudoku);
              // se non è a soluzione unica lo elimina
              if (result?.unique) {
                const doc = getSudokuDoc(result.unique);
                // verifica di coonsistenza dell'hash (stringa dei valori fissi)
                const hash = getHash(fixed);
                if (doc._id !== hash) {
                  console.log(...SDK_PREFIX_W, `wrong hash found! (${doc._id} != ${hash})`);
                  await sudoku.remove().catch(err_r => console.error(`Error while removing doc "${sudoku._id}"`, err_r));
                  if (fixed) {
                    doc._id = hash;
                    await sudoku.update(doc).catch(err_u => console.error(`Error while updating doc "${sudoku._id}"`, err_u));
                  } else {
                    await sudoku.remove().catch(err_r => console.error(`Error while removing doc "${sudoku._id}"`, err_r));
                  }
                } else {
                  await sudoku.update(doc).catch(err_u => console.error(`Error while updating doc "${sudoku._id}"`, err_u));
                }
                console.log(...SDK_PREFIX_W, `schema "${sudoku._id}" updated`);
              } else {
                await sudoku.remove().catch(err_r => console.error(`Error while removing doc "${sudoku._id}"`, err_r));
                console.log(...SDK_PREFIX_W, `schema "${sudoku._id}" removed`);
              }
            }
            i++
          } while (i < LN);
          resolve({ message: `completed!` });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

}

const getSudokuDoc = (sol: SudokuSolution): Sudoku => {
  const doc = _clone(sol.sdk.sudoku);
  doc.values = doc.fixed;
  doc.info = buildSudokuInfo(doc, {
    unique: true,
    algorithms: sol.algorithms
  }, true);
  return <Sudoku>doc;
}

const solveSchema = (s: SudokuDoc): SolveAllResult|undefined => {
  if (s.fixed !== checkImportText(s.fixed, { rank: s.rank })) return undefined;
  console.log('create play-sudoku');
  const sdk = new PlaySudoku({ sudoku: _clone(s) });
  console.log('create solver');
  const solver = new Solver(sdk);
  try {
    console.log('launch solve');
    const result = solver.solve();
    console.log('end solve');
    return result;
  } catch(err_s) {
    console.error('Errors while solve schema');
    return undefined;
  }
}
