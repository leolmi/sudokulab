import { solve } from '@olmi/logic';
import { Sudoku, getCellsSchema, getCoord } from '@olmi/model';

// Uso:
//   node -r ts-node/register -r tsconfig-paths/register tools/find-algo-step.ts <AlgoId> <schema>
// Esempio:
//   node -r ts-node/register -r tsconfig-paths/register tools/find-algo-step.ts OneCellForValue 000100040400900126000007900040000531580000000070600000000009060002750000000002000

const [, , algoId, schema] = process.argv;

if (!algoId || !schema || schema.length !== 81) {
  console.error('Usage: find-algo-step.ts <AlgoId> <81-char-schema>');
  process.exit(1);
}

const sdk = new Sudoku({ values: schema });
const work = solve(sdk, { useTryAlgorithm: true });
const sol = work.solutions[0];
const seq = sol.sequence;

console.log(`status: ${sol.status}, total steps: ${seq.length}`);

const idx = seq.findIndex((r) => r.algorithm === algoId);
if (idx < 0) {
  console.log(`"${algoId}" NOT applied in this solution. Sequence:`);
  seq.forEach((r, i) => console.log(`  [${i}] ${r.algorithm}`));
  process.exit(2);
}

const step = seq[idx];
console.log(`\n=== "${algoId}" first applied at step [${idx}] ===`);
console.log('cells:', step.cells);
console.log('highlights:', JSON.stringify(step.highlights, null, 2));
console.log('descLines:');
step.descLines.forEach((l) => console.log('  ', JSON.stringify(l)));

const preCells = idx === 0 ? sdk.cells || [] : seq[idx - 1].cellsSnapshot;
const preValues = getCellsSchema(preCells, {
  allowDynamic: true,
  allowUserValue: true,
});
console.log('\npre-step schema (81 chars):');
console.log(preValues);

console.log('\npre-step candidates (only cells with available>0):');
preCells
  .filter((c: any) => !c.text && (c.available || []).length > 0)
  .forEach((c: any) =>
    console.log(`  ${getCoord(c.id)} [${c.id}] = [${c.available.join('')}]`)
  );

console.log('\ncoords of step cells:');
(step.cells || []).forEach((id: string) =>
  console.log(`  ${id} -> ${getCoord(id)}`)
);
