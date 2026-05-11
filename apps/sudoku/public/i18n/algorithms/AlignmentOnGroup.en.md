## When it applies

Take a group **A** (row, column or box) and a value **V**. Look at the cells of A where V is still a candidate: if they are _all_ also contained in a second group **B** — for example all inside the same box, or all inside the same row/column — then V, when it ends up in A, must end up in one of those common cells, and therefore **also** inside B.

Consequence: in B, V can be removed from every cell that does not belong to A.

This logic captures the two classic sub-cases:

- **Pointing**: inside a _box_, V is aligned along a row or a column → V is removed from the other cells of that row/column.
- **Claiming** (or box-line reduction): inside a _row_ or _column_, V is confined to a single box → V is removed from the other cells of that box.

## Example — claiming the 6 from column 1 into box 1

> In **column 1** the candidate **6** is only possible in cells **B1** and **C1** (primary highlight). Both are in the top-left box (_box 1_). So the 6, when it ends up in column 1, will fall in one of the two — and inside box 1 it cannot appear elsewhere.

::board[example_1]

> Concrete effect: in cell **B3** (_secondary_) the candidate 6 is removed, because B3 is in box 1 but not in column 1 — and box 1's 6 has already been "claimed" by the column.

## Why it works

Every row, column and box must contain V exactly once. If, in a group A, all positions where V is still possible also lie in a second group B, then V's placement in A is necessarily also a cell of B. So V cannot sit in any other cell of B.
