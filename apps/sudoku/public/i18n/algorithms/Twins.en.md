## When it applies

Take a group (row, column or box) and a pair of values **X** and **Y**. If in that group **both X and Y** can only sit in the same two cells — no other position in the group admits X or Y — then those two cells _are the twins_: they must host exactly X and Y.

Consequences (applied in the same step in SudokuLab):

- from the **two twin cells** every candidate other than X and Y can be removed;
- from the **other cells** of every group that contains both twins (shared row, column or box) X and Y can be removed, if present.

## Example — pair (6, 7) in row D

> In row **D** the values **6** and **7** can only appear in **D2** and **D4** (primary highlight). Right now those cells also contain other candidates — D2 has {2, 4, 6, 7} and D4 has {2, 6, 7, 8} — but since 6 and 7 are forced there, the other candidates of D2 and D4 become impossible.

::board[example_1]

> After applying the algorithm D2 and D4 are left with only {6, 7} as candidates. Moreover, if any other cell in row D (or in any other group shared by the twins) still listed 6 or 7, they could be removed: not needed here because 6 and 7 are no longer candidates elsewhere in row D.

## Why it works

Every sudoku group contains each digit 1–9 exactly once. If X and Y can _only_ sit in two cells of a group, those two cells must host X and Y (no other placement is possible). No other value can therefore occupy them, and X/Y cannot end up in other cells that share a group with both twins.
