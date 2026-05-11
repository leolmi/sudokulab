## The idea — the "bi-value grave"

Imagine a schema in which **all** the cells still to be filled are _bi-value_ (they have exactly 2 candidates) and in which **every value** appears in _exactly 2 cells_ of every group (row, column, box). This configuration is called the **bi-value universal grave**: no matter how a value is chosen for a cell, its "twin" in the group takes the other. The problem is that a second, swapped choice would produce a second equally valid solution.

If the schema has a _unique_ solution (as in SudokuLab) the bi-value grave cannot be reached: there must be _at least one_ cell with 3 candidates that "breaks" the symmetry and rules out the double solution.

## When it applies

In the current state all of these conditions hold:

- all empty cells except one have **2 candidates**;
- exactly _one_ cell — call it **T** — has **3 candidates**;
- for one of the three candidates **V**, in _every group_ (row/column/box) **T** belongs to, V appears as a candidate _exactly twice_.

If T were V, all of T's groups would have V locally placed and the rest of the grid would collapse exactly into a bi-value grave — that is, a double-solution schema. Impossible, so **V can be removed from T's candidates**. If the trivalent cell is left with 2 usable candidates, the next step (often a naked pair/single) closes the puzzle.

## Example — BUG+1 on cell D9

> Schema state at the step where the solver applies BUG. There are 18 empty cells left: all have 2 candidates except **D9** (primary highlight), which has 3 — {1, 6, 9}. The value 1 appears exactly twice in each of D9's three groups:

- row D: {1} at **D3**, D9;
- column 9: {1} at D9, **F9**;
- bottom-right box of D9: {1} at D9, F9.

> The two "witness" cells of the pattern (D3 and F9, secondary highlight) are the ones D9 pairs with to form the 2-occurrence sets.

::board[example_1]

> If D9 were 1, then D3 and F9 would automatically become non-1 and the schema would collapse into a bi-value grave with a double solution. Since the schema has a unique solution, **1** is removed from D9, leaving {6, 9}.

## When to look for it

BUG is an _endgame_ technique: it cannot apply to a sparsely-filled schema because it requires every empty cell except one to be bi-value. SudokuLab's solver weights it with `NP` (percentage of cells already placed), precisely because it is only relevant in the final phase.
