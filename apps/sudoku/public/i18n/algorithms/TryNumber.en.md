## When it applies

Try Number kicks in **only as a last resort**, when no other logical algorithm in the catalogue can produce further progress on the current state. It is the structured equivalent of the manual "try and see": a cell is picked, the schema _splits_ into N parallel copies (one per candidate) and resolution continues on each branch. Branches incompatible with the constraints self-eliminate via error; the branch that completes without contradiction contains the solution.

For this reason Try Number has the **highest priority (100)** in the catalogue: it is tried _after_ any other technique. Each application counts as a "try-algorithm step" (visible as a `T_n_` badge in the catalogue), and is the clearest indicator of a schema's difficulty.

## How it picks the cell — MRV + Degree

To limit the combinatorial explosion, Try Number picks the splitting cell with a two-level heuristic:

- **MRV (Minimum Remaining Values)**: among all empty cells, it takes those with the _smallest_ number of candidates (typically 2). Fewer options = fewer branches to explore.
- **Degree** (tie-break): with equal candidate counts, it prefers the cell that _sees_ the most empty cells (row + column + box). A high-degree cell, once filled, propagates its constraints to more cells, advancing the solve as far as possible within the branch.

## Example — split on cell H5

> Schema state at the step where the solver applies Try Number. There are many cells with 2 candidates (MRV = 2). The Degree heuristic picks **H5** (primary) with candidates {4, 6}: it is the bi-value cell that "sees" the largest number of empty cells in its groups.

::board[example_1]

> The schema splits into two copies: in branch A H5 = 4, in branch B H5 = 6. Each proceeds independently with every algorithm of the catalogue. If one runs into a contradiction (empty cell with zero candidates or group with two equal values) it is discarded; the other continues all the way to the solution.

## Weight on difficulty

The factor `+400+(4*NU*NEP)` is the highest in the catalogue. The variable component (`NEP` high at the start of the schema, low at the end) particularly penalises _try_ events that happen at the start of the process — a sign that the logical algorithms were not enough to even gain ground. A Try Number at 5% of the schema is considerably more expensive than one at 90%, where only a handful of cells remain to be fixed.

## Alternatives and practical notes

For someone solving by hand, "reaching Try Number" amounts to declaring that no known technique allows them to proceed. SudokuLab uses Try Number as a _backstop_: it guarantees that any unique-solution schema is solved in finite time, even when it requires a chain of conditional reasoning (forcing chains, nice loops, etc.) not yet implemented in the catalogue.
