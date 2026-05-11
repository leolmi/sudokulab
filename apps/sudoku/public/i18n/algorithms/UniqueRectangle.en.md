## The idea — avoiding the "deadly pattern"

Consider four cells **at the corners of a rectangle**: two rows, two columns, spread across exactly two boxes (i.e. the two rows belong to the same band of 3 rows, and the columns to the same band of 3 columns). If all four cells had the same two candidates **{X, Y}**, the puzzle's solution would not be unique: the two values could swap among the corners producing _at least two_ valid solutions (the so-called _deadly pattern_).

Since SudokuLab works on schemas guaranteed to have a unique solution, the deadly pattern is impossible: every time we are one step away from creating it, one of the corners must _necessarily_ take a value different from X or Y. That observation is what Unique Rectangle exploits to remove candidates.

## Type 1 — three cells are {X, Y}, the fourth has "extras"

If in a rectangle **three** corners have exactly {X, Y} and the **fourth** has {X, Y} plus one or more "extra" candidates, then that fourth corner cannot become X or Y (otherwise the deadly pattern would form). So from that corner **both candidates X and Y are removed**, leaving only the extras.

## Type 2 — two cells are {X, Y}, two have {X, Y, Z}

If two opposite corners on one row are bi-value {X, Y} and the other two (on the other row) have _identical_ candidates {X, Y, Z}, then Z must necessarily occupy one of the two "extended" corners (to break the deadly pattern). Consequently **Z can be removed from every cell that sees both extended corners at once**.

## Example — Unique Rectangle Type 1 on {1, 3}

> Schema state at the step where the solver applies Unique Rectangle. The four rectangle corners are **A3**, **A6**, **C3**, **C6** (rows A and C × columns 3 and 6, spread across box 1 and box 2 — two boxes). Three of them — **A3**, **C3**, **C6** (primary) — have exactly candidates {1, 3}. The fourth corner **A6** (secondary) has candidates {1, 3, 4}: the "extra" is 4.

::board[example_1]

> If A6 were 1 or 3, the four cells would all be {1, 3} and the two values could swap along the rectangle producing two solutions. Since the puzzle has a unique solution, A6 _must_ be the extra: from A6 we remove **1 and 3**, leaving a naked single {4} that the next step will set.

## Constraints

- The 4 cells must lie on **2 rows × 2 columns** and in **exactly 2 boxes** (one holding the two cells of one column pair, the other holding the two cells of the other column pair). If they were in 4 different boxes the uniqueness constraint would not propagate.
- The algorithm is valid _only_ if the schema has a unique solution. In SudokuLab every catalogue schema is, but on schemas of uncertain provenance this technique must be used with care.
