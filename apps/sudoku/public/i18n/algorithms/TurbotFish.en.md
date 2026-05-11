## The idea — three chained strong links

Fix a value **V**. In a group (row, column or box) where V can sit in _exactly 2 cells_ we have a **strong link**: V will go in one and not in the other. Turbot Fish looks for **three** such strong links tied together:

- a group **g1** with V in two cells — the "endpoint" cell and an "inner" cell;
- a bridging group **g2** with V in two cells, sharing g1's inner cell and g3's inner cell;
- a group **g3** with V in two cells — the other inner cell plus the second "endpoint" cell.

The two real endpoints (g1's cell not touched by g2 and g3's cell not touched by g2) behave like an exclusive alternative: **one of the two must contain V**. Any cell that "sees" (shares a group with) both endpoints cannot contain V: in every scenario one of the two endpoints takes V and collides with it.

## Classic variants

- **Skyscraper**: g1 and g3 are two columns (or rows) with V in two cells each, g2 is a row (or column) joining the top cells.
- **Two-String Kite**: g1 is a row and g3 a column, joined by a box g2.
- **Empty Rectangle**: same logic, g2 is a box where V is confined to one row + one column.

Our implementation recognises them all uniformly by looking for any combination of 3 linked groups.

## Example — Turbot Fish on the value 1

> Schema state at the step where the solver applies Turbot Fish. The value **1** has three chained strong links:

- **row A** (g1): 1 only at **A1** and **A5**;
- **box 2** (g2, bridge): 1 only at **A5** and **C6**;
- **column 6** (g3): 1 only at **C6** and **E6**.

> The chain is **A1 — A5 — C6 — E6**. The two endpoints are **A1** and **E6**: either way one of them holds the 1.

::board[example_1]

> Cell **E1** sees **A1** (same column) and **E6** (same row): whichever of the two endpoints takes the 1, E1 cannot have it. So the candidate 1 is removed from E1 (candidates {1, 2, 3, 9} → {2, 3, 9}).

## How to spot it quickly

Pick a value V. Find every group (rows, columns, boxes) where V has exactly 2 positions and mentally build a graph of strong links. For every triple g1–g2–g3 in which g2 hooks g1 and g3 through two different cells, look at the non-shared endpoints: if an external cell sees both of them, V is removed from there.
